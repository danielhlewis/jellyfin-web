import loading from 'loading';
import libraryMenu from 'libraryMenu';
import globalize from 'globalize';
import 'emby-checkbox';
import 'emby-select';

/* eslint-disable indent */

    function onSubmit(e) {
        const form = this;
        const localAddress = form.querySelector('#txtLocalAddress').value;
        const enableUpnp = form.querySelector('#chkEnableUpnp').checked;
        confirmSelections(localAddress, enableUpnp, function () {
            const validationResult = getValidationAlert(form);

            if (validationResult) {
                showAlertText(validationResult);
                return;
            }

            validateHttps(form).then(function () {
                loading.show();
                ApiClient.getServerConfiguration().then(function (config) {
                    config.LocalNetworkSubnets = form.querySelector('#txtLanNetworks').value.split(',').map(function (s) {
                        return s.trim();
                    }).filter(function (s) {
                        return s.length > 0;
                    });
                    config.RemoteIPFilter = form.querySelector('#txtExternalAddressFilter').value.split(',').map(function (s) {
                        return s.trim();
                    }).filter(function (s) {
                        return s.length > 0;
                    });
                    config.IsRemoteIPFilterBlacklist = 'blacklist' === form.querySelector('#selectExternalAddressFilterMode').value;
                    config.PublicPort = form.querySelector('#txtPublicPort').value;
                    config.PublicHttpsPort = form.querySelector('#txtPublicHttpsPort').value;
                    config.HttpServerPortNumber = form.querySelector('#txtPortNumber').value;
                    config.HttpsPortNumber = form.querySelector('#txtHttpsPort').value;
                    config.EnableHttps = form.querySelector('#chkEnableHttps').checked;
                    config.RequireHttps = form.querySelector('#chkRequireHttps').checked;
                    config.EnableUPnP = enableUpnp;
                    config.BaseUrl = form.querySelector('#txtBaseUrl').value;
                    config.EnableRemoteAccess = form.querySelector('#chkRemoteAccess').checked;
                    config.CertificatePath = form.querySelector('#txtCertificatePath').value || null;
                    config.CertificatePassword = form.querySelector('#txtCertPassword').value || null;
                    config.LocalNetworkAddresses = localAddress ? [localAddress] : [];
                    ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult, Dashboard.processErrorResponse);
                });
            });
        });
        e.preventDefault();
    }

    function triggerChange(select) {
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        select.dispatchEvent(evt);
    }

    function getValidationAlert(form) {
        if (form.querySelector('#txtPublicPort').value === form.querySelector('#txtPublicHttpsPort').value) {
            return 'The public http and https ports must be different.';
        }

        if (form.querySelector('#txtPortNumber').value === form.querySelector('#txtHttpsPort').value) {
            return 'The http and https ports must be different.';
        }

        return null;
    }

    function validateHttps(form) {
        const certPath = form.querySelector('#txtCertificatePath').value || null;
        const httpsEnabled = form.querySelector('#chkEnableHttps').checked;

        if (httpsEnabled && !certPath) {
            return showAlertText({
                title: globalize.translate('TitleHostingSettings'),
                text: globalize.translate('HttpsRequiresCert')
            }).then(Promise.reject);
        }

        return Promise.resolve();
    }

    function showAlertText(options) {
        return new Promise(function (resolve, reject) {
            require(['alert'], function (alert) {
                alert(options).then(resolve, reject);
            });
        });
    }

    function confirmSelections(localAddress, enableUpnp, callback) {
        if (localAddress || !enableUpnp) {
            showAlertText({
                title: globalize.translate('TitleHostingSettings'),
                text: globalize.translate('SettingsWarning')
            }).then(callback);
        } else {
            callback();
        }
    }

    export default function (view, params) {
        function loadPage(page, config) {
            page.querySelector('#txtPortNumber').value = config.HttpServerPortNumber;
            page.querySelector('#txtPublicPort').value = config.PublicPort;
            page.querySelector('#txtPublicHttpsPort').value = config.PublicHttpsPort;
            page.querySelector('#txtLocalAddress').value = config.LocalNetworkAddresses[0] || '';
            page.querySelector('#txtLanNetworks').value = (config.LocalNetworkSubnets || []).join(', ');
            page.querySelector('#txtExternalAddressFilter').value = (config.RemoteIPFilter || []).join(', ');
            page.querySelector('#selectExternalAddressFilterMode').value = config.IsRemoteIPFilterBlacklist ? 'blacklist' : 'whitelist';
            page.querySelector('#chkRemoteAccess').checked = null == config.EnableRemoteAccess || config.EnableRemoteAccess;
            page.querySelector('#txtHttpsPort').value = config.HttpsPortNumber;
            page.querySelector('#chkEnableHttps').checked = config.EnableHttps;
            page.querySelector('#chkRequireHttps').checked = config.RequireHttps;
            page.querySelector('#txtBaseUrl').value = config.BaseUrl || '';
            const txtCertificatePath = page.querySelector('#txtCertificatePath');
            txtCertificatePath.value = config.CertificatePath || '';
            page.querySelector('#txtCertPassword').value = config.CertificatePassword || '';
            page.querySelector('#chkEnableUpnp').checked = config.EnableUPnP;
            triggerChange(page.querySelector('#chkRemoteAccess'));
            loading.hide();
        }

        view.querySelector('#chkRemoteAccess').addEventListener('change', function () {
            if (this.checked) {
                view.querySelector('.fldExternalAddressFilter').classList.remove('hide');
                view.querySelector('.fldExternalAddressFilterMode').classList.remove('hide');
                view.querySelector('.fldPublicPort').classList.remove('hide');
                view.querySelector('.fldPublicHttpsPort').classList.remove('hide');
                view.querySelector('.fldEnableUpnp').classList.remove('hide');
            } else {
                view.querySelector('.fldExternalAddressFilter').classList.add('hide');
                view.querySelector('.fldExternalAddressFilterMode').classList.add('hide');
                view.querySelector('.fldPublicPort').classList.add('hide');
                view.querySelector('.fldPublicHttpsPort').classList.add('hide');
                view.querySelector('.fldEnableUpnp').classList.add('hide');
            }
        });
        view.querySelector('#btnSelectCertPath').addEventListener('click', function () {
            require(['directorybrowser'], function (directoryBrowser) {
                const picker = new directoryBrowser();
                picker.show({
                    includeFiles: true,
                    includeDirectories: true,
                    callback: function (path) {
                        if (path) {
                            view.querySelector('#txtCertificatePath').value = path;
                        }

                        picker.close();
                    },
                    header: globalize.translate('HeaderSelectCertificatePath')
                });
            });
        });
        view.querySelector('.dashboardHostingForm').addEventListener('submit', onSubmit);
        view.addEventListener('viewshow', function (e) {
            loading.show();
            ApiClient.getServerConfiguration().then(function (config) {
                loadPage(view, config);
            });
        });
    }

/* eslint-enable indent */
