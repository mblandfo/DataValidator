class Logger {

    constructor() {
        this.$ele = $('#log');
    }

    $ele: JQuery;

    clear() {
        this.$ele.html('');
    }

    log(msg) {
        this.logHtml(`<div>${msg}</div>`);
    }

    logHtml(html: string) {
        this.$ele.append(html);
    }

    logClass(msg: string, cssClass: string) {
        var msg = `<div class="${cssClass}">${msg}<div>`;
        this.logHtml(msg);
    }

    setLogTitle(title: string) {
        this.clear();
        this.logClass(title, 'logTitle');
    }

    logSuccess(msg: string) {
        this.logClass(msg, 'logSuccess');
    }

    logFailure(msg: string) {
        this.logClass(msg, 'logFailure');
    }
}