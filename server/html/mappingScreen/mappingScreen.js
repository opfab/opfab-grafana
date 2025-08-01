const mappingServiceUrl = 'http://localhost:2002/alerting/mapping';
let config;

async function init() {
    config = await fetchConfig();
    if (config) {
        initTable();
        initForm();
        document.querySelector('#add-button').addEventListener('click', () => {
            if (!config.grafanaFolders.size) document.querySelector('#no-folders-dialog').showModal();
            else document.querySelector('#form-dialog').showModal();
        });
        document.querySelector('#content').removeAttribute('hidden');
    } else document.querySelector('#no-config').removeAttribute('hidden');
}

async function fetchConfig() {
    try {
        const response = await sendRequest(mappingServiceUrl);
        return {
            grafanaFolders: new Map(response.grafanaFolders),
            grafanaAlertRules: new Map(response.grafanaAlertRules),
            grafanaStructure: new Map(response.grafanaStructure),
            entities: new Map(response.entities),
            mappings: new Map(response.mappings)
        };
    } catch (err) {
        console.log('Error fetching config,', err);
    }
}

function initTable() {
    const tbody = document.querySelector('#mappings-tbody');
    config.mappings.forEach((cardOptions, uid) => {
        tbody.append(createTableRow(uid, cardOptions));
    });
}

function createTableRow(uid, cardOptions) {
    const uidType = config.grafanaFolders.has(uid)
        ? 'folder'
        : config.grafanaAlertRules.has(uid)
            ? 'rule'
            : 'unknow';
    const row = createHtmlElement('tr', {uid: uid, uidType: uidType});

    const folderCell = row.insertCell();
    const ruleCell = row.insertCell();
    if (uidType === 'folder') {
        folderCell.textContent = config.grafanaFolders.get(uid);
        ruleCell.textContent = '/';
    } else if (uidType === 'rule') {
        folderCell.textContent = config.grafanaFolders.get(config.grafanaStructure.get(uid));
        ruleCell.textContent = config.grafanaAlertRules.get(uid);
    } else {
        folderCell.textContent = uid;
        ruleCell.textContent = uid;
    }

    const recipientsCell = row.insertCell();
    if (cardOptions.recipients?.length)
        recipientsCell.innerHTML = cardOptions.recipients.map((entityId) => config.entities.get(entityId) ?? entityId).join('<br>');
    else recipientsCell.textContent = '/';

    row.insertCell().textContent = cardOptions.title || '/';

    const firingDiv = createHtmlElement('div', {
        text: 'Firing :',
        style: 'display: flex; align-items: center; column-gap: 8px; margin-top: 10px; margin-bottom: 10px'
    });
    if (cardOptions.firingSeverity) {
        firingDiv.append(
            createHtmlElement('div', {
                style: `min-width: 10px; min-height: 25px; background-color: var(--opfab-color-severity-${cardOptions.firingSeverity.toLowerCase()})`
            }),
            cardOptions.firingSeverity
        );
    } else firingDiv.textContent += ' /';

    const resolvedDiv = createHtmlElement('div', {
        text: 'Resolved :',
        style: 'display: flex; align-items: center; column-gap: 8px; margin-bottom: 10px'
    });
    if (cardOptions.resolvedSeverity) {
        resolvedDiv.append(
            createHtmlElement('div', {
                style: `min-width: 10px; min-height: 25px; background-color: var(--opfab-color-severity-${cardOptions.resolvedSeverity.toLowerCase()})`
            }),
            cardOptions.resolvedSeverity
        );
    } else resolvedDiv.textContent += ' /';

    row.insertCell().append(firingDiv, resolvedDiv);

    const editButton = uidType !== 'unknow'
        ? createHtmlElement('button', {
            text: 'EDIT',
            style: 'cursor: pointer',
            class: 'opfab-btn'
        })
        : createHtmlElement('button', {
            text: 'EDIT',
            style: 'cursor: not-allowed',
            disabled: '',
            class: 'opfab-btn'
        });
    editButton.addEventListener('click', tableEditClicked);
    row.insertCell().append(editButton);

    const deleteButton = createHtmlElement('button', {
        text: 'DELETE',
        style: 'cursor: pointer',
        class: 'opfab-btn-cancel'
    });
    deleteButton.addEventListener('click', tableDeleteClicked);
    row.insertCell().append(deleteButton);

    return row;
}

function createHtmlElement(tag, {text = '', style = '', ...attrs}) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (style) element.style.cssText = style;
    Object.entries(attrs).forEach(([attr, value]) => element.setAttribute(attr, value));
    return element;
}

function tableEditClicked(event) {
    const uid = event.target.closest('tr').getAttribute('uid');
    const uidType = event.target.closest('tr').getAttribute('uidType');
    const cardOptions = config.mappings.get(uid);
    const formDialog = document.querySelector('#form-dialog');
    const folderSelect = formDialog.querySelector('#folder-select');
    const ruleSelect = formDialog.querySelector('#rule-select');

    if (uidType === 'folder') folderSelect.setValue(uid, true);
    else {
        folderSelect.setValue(config.grafanaStructure.get(uid), true);
        ruleSelect.setOptions([{label: config.grafanaAlertRules.get(uid), value: uid}]);
        ruleSelect.setValue(uid);
    }
    folderSelect.disable();
    ruleSelect.disable();

    formDialog.querySelector('#entities-select').setValue(cardOptions.recipients);
    formDialog.querySelector('#title-input').value = cardOptions.title;
    formDialog.querySelector('#firing-sev-select').setValue(cardOptions.firingSeverity);
    formDialog.querySelector('#resolved-sev-select').setValue(cardOptions.resolvedSeverity);

    formDialog.showModal();
}

async function tableDeleteClicked(event) {
    if (await confirmDelete()) {
        const row = event.target.closest('tr');
        const uid = row.getAttribute('uid');
        try {
            await sendRequest(mappingServiceUrl + '/' + uid, {method: 'DELETE'});
            config.mappings.delete(uid);
            row.remove();
        } catch (err) {
            console.log('Error deleting mapping,', err);
        }
    }
}

function confirmDelete() {
    const confirmDialog = document.querySelector('#confirm-delete-dialog');
    return new Promise((resolve) => {
        confirmDialog.addEventListener('close', () => {
            resolve(confirmDialog.returnValue);
        }, {once: true});
        confirmDialog.showModal();
    });
}

function updateTable(uid, cardOptions) {
    const row = document.querySelector(`[uid="${uid}"]`);
    const newRow = createTableRow(uid, cardOptions);

    row ? row.replaceWith(newRow) : document.querySelector('#mappings-tbody').append(newRow);
}

function initForm() {
    const folderOptions = Array.from(config.grafanaFolders, ([uid, title]) => ({label: title, value: uid}));
    VirtualSelect.init({
        ele: '#folder-select',
        options: folderOptions,
        required: true,
        search: true,
        showValueAsTags: true,
        enableSecureText: true
    });

    VirtualSelect.init({
        ele: '#rule-select',
        search: true,
        placeholder: 'None',
        showValueAsTags: true,
        enableSecureText: true,
        disabled: true
    });

    const entityOptions = Array.from(config.entities, ([id, name]) => ({label: name, value: id}));
    VirtualSelect.init({
        ele: '#entities-select',
        options: entityOptions,
        multiple: true,
        showValueAsTags: true,
        selectAllOnlyVisible: true,
        enableSecureText: true
    });

    const severityOptions = ['ALARM', 'ACTION', 'COMPLIANT', 'INFORMATION'];
    VirtualSelect.init({
        ele: '#firing-sev-select',
        options: severityOptions,
        placeholder: 'Default',
        showValueAsTags: true,
        enableSecureText: true,
        labelRenderer: severityOptionRenderer,
        selectedLabelRenderer: severityOptionRenderer
    });
    VirtualSelect.init({
        ele: '#resolved-sev-select',
        options: severityOptions,
        placeholder: 'Default',
        showValueAsTags: true,
        enableSecureText: true,
        labelRenderer: severityOptionRenderer,
        selectedLabelRenderer: severityOptionRenderer
    });

    document.querySelector('#submit-button').addEventListener('click', formSubmit);
    document.querySelector('#cancel-button').addEventListener('click', (event) => {event.target.closest('dialog').close()});
    document.querySelector('#form-dialog').addEventListener('close', formReset);
    document.querySelector('#folder-select').addEventListener('change', (event) => {
        const folderUid = event.target.value;
        const ruleSelect = document.querySelector('#rule-select');

        const ruleOptions = config.grafanaStructure.get(folderUid)?.map((ruleUid) => ({
            label: config.grafanaAlertRules.get(ruleUid),
            value: ruleUid
        })) ?? [];
        ruleSelect.setOptions(ruleOptions);
        if (ruleOptions.length) {
            ruleSelect.setDisabledOptions(config.mappings.keys());
            ruleSelect.enable();
        } else ruleSelect.disable();
    });
}

function severityOptionRenderer(option) {
    return `<div style="display: flex; align-items: center; column-gap: 8px">
                <div style="min-width: 10px; min-height: 25px; background-color: var(--opfab-color-severity-${option.value.toLowerCase()})"></div>
                ${option.label}
            </div>`;
}

async function formSubmit(event) {
    const form = event.target.closest('form');

    if (VirtualSelect.validate(form)) {
        const formData = new FormData(form);
        const elementUid = form.querySelector('#rule-select').value ||
            form.querySelector('#folder-select').value;
        const cardOptions = {
            recipients: formData.get('entities')
                ? formData.get('entities').split(',')
                : [],
            title: formData.get('title'),
            firingSeverity: formData.get('firing-sev'),
            resolvedSeverity: formData.get('resolved-sev')
        };

        try {
            await sendRequest(mappingServiceUrl + '/' + elementUid, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(cardOptions)
            });
            config.mappings.set(elementUid, cardOptions);
            updateTable(elementUid, cardOptions);
        } catch (err) {
            console.log('Error posting mapping,', err);
        }
        form.closest('dialog').close();
    }
}

function formReset(event) {
    document.querySelector('#folder-select').enable();
    event.target.querySelector('form').reset();
}

async function sendRequest(url, options = {}) {
    options.headers ??= {};
    options.headers['Authorization'] = `Bearer ${getToken()}`;
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`bad response ${response.status}`);
    if (response.status !== 204) return await response.json();
}

function getToken() {
    return localStorage.getItem('token');
}

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('opfab_theme') === 'NIGHT') opfabStyle.setOpfabTheme(opfabStyle.NIGHT_THEME);
    else opfabStyle.setOpfabTheme(opfabStyle.DAY_THEME);

    init();
});
