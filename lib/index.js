const cheerio = require('cheerio');
const needle = require('needle');

class TempMail {
    constructor() {
        this.host = 'https://temp-mail.org/en';
        this.csrf = '';
        this.domains = [];
        this.inbox = {};

        this.options = {
            follow: 5
        };
    }

    /**
     * Makes GET request
     * @param {string} url
     * @returns {Promise.<Object, Error>}
     */
    crawl(url) {
        return new Promise((rs, rj) => {
            needle.get(this.host + url, this.options, (err, res) => {
                this.options.cookies = res.cookies;
                if (err) {
                    console.log(err, res);
                    rj(err, res);
                }
                else rs(cheerio.load(res.body), res);
            });
        });
    }

    /**
     * Receives available domains
     * @returns {Promise.<Array, Error>}
     */
    getAvailableDomains() {
        return this.crawl('/option/change/').then($ => {
            this.csrf = $('input[name=csrf]').val();
            this.domains = $('#domain option').map((i, o) => $(o).val()).toArray();
            this.email = $('#mail').val();

            return this.domains;
        });
    }

    /**
     * Generates random email in given domains
     * @param {number} [len=7]
     * @param {string} prefix
     * @returns {string}
     */
    getRandomName(len = 7, prefix = '') {
        const alfabet = '1234567890abcdefghijklmnopqrstuvwxyz';
        let name = !prefix ? '' : `${prefix}-`;

        for (let i = 0; i < len; i++) {
            const randomChar = Math.round(Math.random() * (alfabet.length - 1));
            name += alfabet.charAt(randomChar);
        }

        return name;
    }

    /**
     * Generates random email in given domains
     * @param {array} domains
     * @returns {string}
     */
    getRandomDomain(domains = this.domains) {
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return domain;
    }

    /**
     * Generates email
     * @param {number} [len]
     * @param {string} prefix
     * @param {array} domains
     * @returns {Promise.<String, Error>}
     */
    generateEmail(len, prefix, domains = this.domains) {
        return this.getRandomName(len, prefix) + this.getRandomDomain(domains);
    }

    /**
     * Makes GET request
     * @param {string} mail
     * @param {string} domain
     * @returns {Promise.<Object, Error>}
     */
    change(mail, domain = this.getRandomDomain()) {
        let data = {csrf: this.csrf, mail, domain};
        let opts = Object.assign({multipart: true}, this.options);

        if (mail.indexOf('@') !== -1) {
            let [m, d] = mail.split('@');
            data.mail = m;
            data.domain = '@' + d;
        }

        if (!data.csrf) {
            throw new Error('data.csrf is empty');
        }
        if (!data.mail) {
            throw new Error('data.mail is empty');
        }
        if (!data.domain) {
            throw new Error('data.domain is empty');
        }

        return needle('post', `${this.host}/option/change/`, data, opts).then(res => {
            this.options.cookies = res.cookies;
            return cheerio.load(res.body);
        });
    }

    remove(mail = '') {
        if (this.options.cookies) {
            delete this.options.cookies.mail;
        }

        return this.crawl('/option/delete/').then(($) => {

        })
    }

    /**
     * Receives inbox
     * @returns {Promise.<Object[], Error>}
     */
    refresh() {
        return this.crawl('/option/refresh/').then(($) => {
            this.email = $('#mail').val();
            console.log('refresh inbox ', this.email);
            return $('#mails tbody tr').map((i, tr) => {
                let [from, subject] = $(tr).find('>td').map((i2, td) => $(td).text()).toArray();
                let hash = $(tr).find('a').attr('href').replace(/^.+\//g, '');
                return (this.inbox[hash] = { hash, from, subject, body: '' });
            }).toArray();
        })
    }

    /**
     * View mail
     * @param {string} hash
     * @returns {Promise.<String, Error>}
     */
    view(hash){
        return this.crawl(`/view/${hash}`).then($ => {

            let result = $('h1').text().trim();

            if (result.indexOf('404') !== -1) {
                throw new Error(`/view/${hash}: ${result}`);
            }

            let body = $('.pm-text').html();
            if (hash in this.inbox) {
                this.inbox[hash].body = body;
            }

            return body;
        })
    }

    delete(hash){
        this.crawl(`/delete/${hash}`).then($ => {
            if (hash in this.inbox) {
                delete this.inbox[hash];
            }

            let body = $('.pm-text').text();
            console.log(body.trim());
        });
    }

    attachment(key, name, mailId){
        needle.get(`/option/attachment_download?key=${key}&name=${name}&mailId=${mailId}`, { output: '/tmp/tux' }, function(err, res, body) {
            console.log(err, res, body);
        });
    }

    download(hash){
        needle.get(`/download/${hash}`, { output: '/tmp/tux.eml' }, function(err, res, body) {
            console.log(err, res, body);
        });
    }

    source(hash){
        this.crawl(`/source/${hash}`).then($ => {
            let body = $('.pm-text').text();
            console.log(body.trim());
        });
    }
}

module.exports = TempMail;
