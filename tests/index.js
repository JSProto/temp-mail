const test = require('tape'); // eslint-disable-line import/no-extraneous-dependencies
const TempMail = require('../lib');

let tmp = new TempMail();


test('Get domain list', (t) => {
    tmp.getAvailableDomains()
        .then((domains) => {
            t.equal(typeof domains, 'object', 'domains is a array');
            t.notEqual(domains.length, 0, 'domains list not empty');
            t.end();
        });
});

test('Create a new email', (t) => {
    let email = tmp.generateEmail()

    t.equal(typeof email, 'string', 'email is a string');
    t.notEqual(email.indexOf('@'), -1, 'email contains at-mark');
    t.end();
});

test('Generate email with prefix', (t) => {
    // avoid http error 429
    setTimeout(() => {
        let email = tmp.generateEmail(5, 'prefix', ['@mail.com'])

        const name = email.slice(0, email.indexOf('@'));
        const prefix = name.slice(0, 6);

        t.equal(name.length, 12, 'email name is correct');
        t.equal(prefix, 'prefix', 'prefix is correct');

        t.end();
    }, 700);
});

test('Generate email without prefix', (t) => {
    // avoid http error 429
    setTimeout(() => {
        let email = tmp.generateEmail(5)
        const name = email.slice(0, email.indexOf('@'));

        t.equal(name.length, 5, 'email name is correct');

        t.end();
    }, 700);
});


test('Get inbox', (t) => {
    tmp.refresh()
        .then(inbox => {
            t.equal(inbox.length, 0, 'inbox is empty');
            t.end();
        })
        .catch((err) => {
            t.equal(err.message, 'Request failed: 404', 'inbox is empty');
            t.end();
        });
});

test('Change email', (t) => {
    let newEmail = tmp.generateEmail(5);
    tmp.change(newEmail)
        .then($ => {
            t.equal(newEmail, $('#mail').val(), 'email changed');
            t.end();
        });
});
