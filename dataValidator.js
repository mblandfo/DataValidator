var Logger = (function () {
    function Logger() {
        this.$ele = $('#log');
    }
    Logger.prototype.clear = function () {
        this.$ele.html('');
    };
    Logger.prototype.log = function (msg) {
        this.logHtml("<div>" + msg + "</div>");
    };
    Logger.prototype.logHtml = function (html) {
        this.$ele.append(html);
    };
    Logger.prototype.logClass = function (msg, cssClass) {
        var msg = "<div class=\"" + cssClass + "\">" + msg + "<div>";
        this.logHtml(msg);
    };
    Logger.prototype.setLogTitle = function (title) {
        this.clear();
        this.logClass(title, 'logTitle');
    };
    Logger.prototype.logSuccess = function (msg) {
        this.logClass(msg, 'logSuccess');
    };
    Logger.prototype.logFailure = function (msg) {
        this.logClass(msg, 'logFailure');
    };
    Logger.prototype.logWarning = function (msg) {
        this.logClass(msg, 'logWarning');
    };
    return Logger;
})();
$(function () {
    var logger = new Logger();
    $('#runTestsBtn').click(function () {
        var testRunner = new TestRunner(logger);
        testRunner.runTests();
    });
    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $('#drop_zone').removeClass('dragging');
        logger.clear();
        var files = evt.dataTransfer.files; // FileList object.
        var f = files[0];
        getFileData(f, function (csvStr) {
            if (!csvStr.trim()) {
                logger.logFailure('no data found in file');
                return;
            }
            try {
                var csvData = $.csv.toObjects(csvStr);
            }
            catch (e) {
                logger.logFailure('Unable to read file. It should be a csv file.');
                return;
            }
            logger.logFailure(f.name + ': read ' + csvData.length + ' rows');
            var v = new Validator(logger);
            v.validate(csvData);
        });
    }
    function getFileData(f, go) {
        var r = new FileReader();
        r.onload = function (e) {
            var contents = e.target.result;
            go(contents);
        };
        r.readAsText(f);
    }
    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $('#drop_zone').addClass('dragging');
        evt.dataTransfer.dropEffect = 'copy';
    }
    function handleDragLeave(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $('#drop_zone').removeClass('dragging');
    }
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('dragleave', handleDragLeave, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
});
var TestRunner = (function () {
    function TestRunner(logger) {
        this.logger = logger;
    }
    TestRunner.prototype.runTests = function () {
        $('#log').html('<div></div>');
        this.testValidationUtil();
        this.testTitle();
        this.testFirstName();
        this.testLastName();
        this.testEmail();
    };
    TestRunner.prototype.expect = function (result, expected, name) {
        if (result !== expected) {
            this.logger.logFailure("Internal Failure: " + name + " was " + result + " but should be " + expected);
        }
    };
    /** Test cases that are important to us, but not to users */
    TestRunner.prototype.testValidationUtil = function () {
        var _this = this;
        var test = function (list, name, func) {
            _.each(list, function (testCase) {
                var result = func(testCase[0]);
                _this.expect(result, testCase[1], name + "(" + testCase[0] + ")");
            });
        };
        var acryonyms = [
            ['A.B.C.', true],
            ['ABC', true],
            ['A.B.C', false],
            ['ABc', false],
            ['aBC', false],
            ['AbC', false],
            ['AB.C.', false],
            ['AC', true],
            ['A', false],
            ['Dr.', true],
            ['Mrs.', true],
        ];
        test(acryonyms, "ValidationUtil.IsAcryonym", ValidationUtil.IsAcryonym);
        var titleCaseStrings = [
            ['a', false],
            ['A', true],
            ['Aaron', true],
            ['AaA', false],
            ['aA', false],
        ];
        test(titleCaseStrings, "ValidationUtil.IsTitleCase", ValidationUtil.IsTitleCase);
        var upperChars = 'ÑANO';
        var lowerChars = 'ñano';
        var invalidChars = ',.<>/?;\':"[]{}!@#$%^&*()_+1234567890-=';
        var invalidTestCases = _.map(invalidChars, function (x) { return [x, false]; });
        var upperTestCases = invalidTestCases
            .concat(_.map(upperChars, function (x) { return [x, true]; }))
            .concat(_.map(lowerChars, function (x) { return [x, false]; }));
        var lowerTestCases = invalidTestCases
            .concat(_.map(upperChars, function (x) { return [x, false]; }))
            .concat(_.map(lowerChars, function (x) { return [x, true]; }));
        test(upperTestCases, "ValidationUtil.IsUpperCase", ValidationUtil.IsUpperCaseChar);
        test(lowerTestCases, "ValidationUtil.IsLowerCase", ValidationUtil.IsLowerCaseChar);
    };
    TestRunner.prototype.log = function (validatorName, data, expected, success) {
        var expectedMsg = expected ? "Valid" : "Invalid";
        if (success) {
            var msg = validatorName + " of \"" + data + "\" was correctly marked as " + expectedMsg;
            this.logger.logSuccess(msg);
        }
        else {
            var msg = validatorName + " of \"" + data + "\" was expected to be " + expectedMsg;
            this.logger.logFailure(msg);
        }
    };
    TestRunner.prototype.getTestFunc = function (validator, validatorName) {
        var _this = this;
        return function (name, expectedResult) {
            var errMsg = validator.validate({ x: name });
            var actual = errMsg === '' || errMsg === undefined;
            var success = (expectedResult === actual);
            _this.log(validatorName, name, expectedResult, success);
        };
    };
    TestRunner.prototype.testTitle = function () {
        var validator = new TitleValidator("x");
        var test = this.getTestFunc(validator, "Title");
        test("A Walk in the Best Of", true);
        test("Joining The Navy", false);
        test("a Walk", false);
        test("Dr. Dolittle", true);
        test("VP, Corporate Planning & Real estate", false);
        test("VP, Corporate Planning & Real Estate", true);
        test("CEO", true);
    };
    TestRunner.prototype.testFirstName = function () {
        var validator = new FirstNameValidator("x");
        var test = this.getTestFunc(validator, "FirstName");
        test("A.", true);
        test("RG.", false);
        test("Pr'yon", false);
        test("jamie", false);
        test("Johann", true);
        test("Mike", true);
        //test('LaShawn', true);
    };
    TestRunner.prototype.testLastName = function () {
        var validator = new LastNameValidator("x");
        var test = this.getTestFunc(validator, "LastName");
        test("Pr'yon", false);
        test("jamie", false);
        test("Johann", true);
        test("Mike", true);
        test("MIKE", false);
        test("O'hara", false);
        test("O'Hara", true);
        test("O'HAra", false);
        test("O''Hara", false);
        test("Hans-McGreggor", true);
        test("McGreggor", true);
        test("McGreggor-O'Neal", true);
        test("McGreggor-johnson", false);
        test("Too-Many-Hyphens", false);
        test("Del Rosario", false); // ?
        test("del Rosario", true);
        test("Van Meter", false);
        test('Van', true);
        test("MacKracken", true);
        test('Maclemore', true);
        test('Lassie', true);
        test("DeMichele", true);
        test('Denala', true);
        test("Treviño", true);
        //test("P.Marino", true); // ?
    };
    TestRunner.prototype.testEmail = function () {
        var validator = new EmailValidator("x");
        var test = this.getTestFunc(validator, "Email");
        test("bob@", false);
        test("@f.com", false);
        test("a@a.com", true);
        test("@a.", false);
        test(".com", false);
        test("@.com", false);
        test("John", false);
        test("john.com", false);
        test("Mike.Johnson@aol.com", true);
        test('John_Samson@john-samson.ti.us', true);
    };
    return TestRunner;
})();
var ValidationUtil = (function () {
    function ValidationUtil() {
    }
    ValidationUtil.IsInitial = function (str) {
        return str.length === 2 && ValidationUtil.IsUpperCaseChar(str[0]) && str[1] === '.';
    };
    /** This also counts abbreviations such as Dr. */
    ValidationUtil.IsAcryonym = function (str) {
        if (str.length < 2) {
            return false;
        }
        if (str.length % 2 === 0) {
            var hasDots = true;
            for (var i = 0; i < str.length; i++) {
                var isDot = str[i] === '.';
                var shouldBeDot = (i % 2) === 1;
                if (isDot !== shouldBeDot) {
                    hasDots = false;
                }
            }
            if (hasDots) {
                str = str.replace(/\./g, '');
            }
        }
        if (str[str.length - 1] === '.' && ValidationUtil.IsTitleCase(str.substr(0, str.length - 1))) {
            return true;
        }
        return _.every(str, function (c) { return ValidationUtil.IsUpperCaseChar(c); });
    };
    ValidationUtil.IsUpperCaseChar = function (c) {
        return !!(c.match(/^[A-Z]$/) || ValidationUtil.upperAccentMap[c]);
    };
    ValidationUtil.IsLowerCaseChar = function (c) {
        return !!(c.match(/^[a-z]$/) || ValidationUtil.lowerAccentMap[c]);
    };
    ValidationUtil.IsTitleCase = function (str) {
        if (str.length === 1) {
            return ValidationUtil.IsUpperCaseChar(str[0]);
        }
        return ValidationUtil.IsUpperCaseChar(str[0]) && _.every(str.substr(1), function (c) { return ValidationUtil.IsLowerCaseChar(c); });
    };
    /** If it is the first or last word in a title, it must be title case. Otherwise, the above words are allowed to be lower case */
    ValidationUtil.IsTitleCaseMiddleWord = function (str) {
        if (ValidationUtil.allowedLowerCaseStringMap[str]) {
            return true;
        }
        if (ValidationUtil.allowedLowerCaseStringMap[str.toLowerCase()]) {
            return false;
        }
        return ValidationUtil.IsTitleCase(str);
    };
    ValidationUtil.IsTitleCaseOrAcronymPhrase = function (phrase) {
        if (phrase.length <= 2) {
            return _.every(phrase, function (word) { return ValidationUtil.IsAcryonym(word) || ValidationUtil.IsTitleCase(word); });
        }
        for (var i = 0; i < phrase.length; i++) {
            if (ValidationUtil.IsAcryonym(phrase[i])) {
                continue;
            }
            if (i === 0 || i === phrase.length - 1) {
                if (!ValidationUtil.IsTitleCase(phrase[i])) {
                    return false;
                }
            }
            else {
                if (!ValidationUtil.IsTitleCaseMiddleWord(phrase[i])) {
                    return false;
                }
            }
        }
        return true;
    };
    ValidationUtil.GetEmailDomain = function (email) {
        var idx = email.indexOf("@");
        if (idx < 0 || idx == email.length - 1) {
            return "";
        }
        return email.substring(idx + 1);
    };
    ValidationUtil.StripLastNamePrefix = function (lastName) {
        var prefixes = ValidationUtil.lastNamePrefixes;
        for (var i = 0; i < prefixes.length; i++) {
            var prefix = prefixes[i];
            if (lastName.indexOf(prefix) === 0 && lastName.length > prefix.length) {
                return lastName.substr(prefix.length);
            }
        }
        return lastName;
    };
    ValidationUtil.IsKnownLastName = function (str) {
        var data = nameData[str];
        return data & 2;
    };
    ValidationUtil.IsKnownFirstName = function (str) {
        var data = nameData[str];
        return data & 1;
    };
    ValidationUtil.IsSuspiciousLookingEmail = function (email) {
        var re = /\S+@\S+\.\S+/;
        return !re.test(email);
    };
    ValidationUtil.allowedLowerCaseStringMap = _.keyBy(['a', 'an', 'and', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']);
    ValidationUtil.lastNamePrefixes = ['Mc', 'Mac', 'De', 'del ', 'van ', 'O\'', 'D\''];
    ValidationUtil.accentedUpperCharacters = "ÀÈÌÒÙÁÉÍÓÚÝÂÊÎÔÛÃÑÕÄËÏÖÜŸ";
    ValidationUtil.accentedLowerCharacters = "áéíóúýâêîôûãñõäëïöüÿ";
    ValidationUtil.upperAccentMap = _.keyBy(ValidationUtil.accentedUpperCharacters, _.identity);
    ValidationUtil.lowerAccentMap = _.keyBy(ValidationUtil.accentedLowerCharacters, _.identity);
    return ValidationUtil;
})();
var Validator = (function () {
    function Validator(logger) {
        this.logger = logger;
    }
    Validator.prototype.validate = function (csvData) {
        var rowNum = 0;
        try {
            if (csvData.length === 0) {
                this.logger.clear();
                this.logger.logFailure('File was empty');
                return;
            }
            var validators = this.getValidators(csvData);
            if (validators.length === 0) {
                this.logger.clear();
                this.logger.logFailure('No columns that need validation were found');
                return;
            }
            var msg = 'Validating the following columns from your file: ';
            msg += _.map(validators, function (v) { return _.escape(v.columnName); }).join(', ');
            this.logger.setLogTitle(msg);
            for (var i = 0; i < csvData.length; i++) {
                rowNum = i + 2;
                this.checkValidationErrors(rowNum, csvData[i], validators);
            }
            this.logger.log('Done! ' + csvData.length + ' rows validated!');
        }
        catch (e) {
            this.logger.logFailure(("Row " + rowNum + ": ERROR! ") + e.stack || e.toString());
        }
    };
    Validator.prototype.checkValidationErrors = function (rowNum, row, validators) {
        var _this = this;
        _.each(validators, function (validator) {
            var v = validator.validate(row);
            if (v) {
                _this.logger.logFailure("Row " + rowNum + ": " + v);
            }
        });
    };
    Validator.prototype.getValidators = function (csvData) {
        var _this = this;
        var colNames = _.keys(csvData[0]);
        var validators = [];
        _.each(colNames, function (col) {
            var validator = _this.getValidatorForColumn(col);
            if (validator) {
                validators.push(validator);
            }
        });
        return validators;
    };
    Validator.prototype.getValidatorForColumn = function (colName) {
        var lowerName = colName.toLowerCase().replace(/[^a-z]/gi, '');
        switch (lowerName) {
            case "firstname":
                return new FirstNameValidator(colName);
            case "lastname":
                return new LastNameValidator(colName);
            case "title":
                return new TitleValidator(colName);
            case "email":
                return new EmailValidator(colName);
            default:
                return undefined;
        }
    };
    return Validator;
})();
var FirstNameValidator = (function () {
    function FirstNameValidator(columnName) {
        this.columnName = columnName;
    }
    FirstNameValidator.prototype.validate = function (row) {
        var data = row[this.columnName];
        if (!data) {
            return this.columnName + " was empty";
        }
        //if (data.length > 3 && data.match(/\s[A-Z]\.$/)) {
        //    data = data.substring(0, data.length - 3);
        //}
        if (ValidationUtil.IsInitial(data)) {
            return;
        }
        if (data.match(/\s/)) {
            return this.columnName + " has funny white space: \"" + data + "\"";
        }
        var known = ValidationUtil.IsKnownFirstName(data);
        if (!known && !ValidationUtil.IsTitleCase(data)) {
            return this.columnName + " not title case: \"" + data + "\"";
        }
        //if (!known) {
        //    return `${this.columnName} contains unknown first name: "${data}"`;
        //}
        if (!data.match(/^[A-Za-z\.]*$/)) {
            return this.columnName + " has unusual characters: \"" + data + "\"";
        }
    };
    return FirstNameValidator;
})();
var LastNameValidator = (function () {
    function LastNameValidator(columnName) {
        this.columnName = columnName;
    }
    LastNameValidator.prototype.validate = function (row) {
        var _this = this;
        var data = row[this.columnName];
        if (!data) {
            return this.columnName + " was empty";
        }
        var isHyphenated = data.indexOf('-') >= 0;
        if (!isHyphenated) {
            if (!this.validateLastName(data)) {
                return this.columnName + " looks suspicious: \"" + data + "\"";
            }
            else {
                return;
            }
        }
        var nameParts = data.split('-');
        if (nameParts.length !== 2) {
            return this.columnName + " too many hyphens: \"" + data + "\"";
        }
        var looksValid = _.every(nameParts, function (part) { return _this.validateLastName(part); });
        if (!looksValid) {
            return this.columnName + " looks suspicious: \"" + data + "\"";
        }
        if (!data.match(/^[A-Za-z\.\-']*$/)) {
            return this.columnName + " has unusual characters: \"" + data + "\"";
        }
    };
    LastNameValidator.prototype.validateLastName = function (lastName) {
        if (ValidationUtil.IsKnownLastName(lastName)) {
            return true;
        }
        if (ValidationUtil.IsTitleCase(lastName)) {
            return true;
        }
        var simpleName = ValidationUtil.StripLastNamePrefix(lastName);
        return ValidationUtil.IsTitleCase(simpleName);
    };
    return LastNameValidator;
})();
var TitleValidator = (function () {
    function TitleValidator(columnName) {
        this.columnName = columnName;
    }
    TitleValidator.prototype.validate = function (row) {
        var data = row[this.columnName];
        if (!data) {
            return this.columnName + " was empty";
        }
        var str = data.replace(TitleValidator.symbolRegex, ' ');
        var filteredParts = _.filter(str.split(' '), function (x) { return x; });
        var startsWithFirstPart = data.indexOf(filteredParts[0]) === 0;
        var lastPart = _.last(filteredParts);
        var endsWithLastPart = data.indexOf(lastPart) === data.length - lastPart.length;
        if (!startsWithFirstPart || !endsWithLastPart || _.some(filteredParts, function (p) { return !p || p.match(/\s/); })) {
            return this.columnName + " has funny white spacing: \"" + data + "\"";
        }
        if (!ValidationUtil.IsTitleCaseOrAcronymPhrase(filteredParts)) {
            return this.columnName + " not in title case: \"" + data + "\"";
        }
        if (_.some(filteredParts, function (part) { return !part.match(/^[A-Za-z\.\(\)]*$/); })) {
            return this.columnName + " has unusual characters: \"" + data + "\"";
        }
    };
    TitleValidator.symbolRegex = /, |\/| - | – | & |-|–|&/g;
    return TitleValidator;
})();
var EmailValidator = (function () {
    function EmailValidator(columnName) {
        this.columnName = columnName;
    }
    EmailValidator.prototype.validate = function (row) {
        var data = row[this.columnName];
        if (!data) {
            return this.columnName + " was empty";
        }
        if (data.match(/\s/)) {
            return this.columnName + " contains white space: \"" + data + "\"";
        }
        if (ValidationUtil.IsSuspiciousLookingEmail(data)) {
            return this.columnName + " looks suspicious: \"" + data + "\"";
        }
        if (!data.match(/^[A-Za-z0-9\-_\.@]*$/)) {
            return this.columnName + " has unusual characters: \"" + data + "\"";
        }
    };
    return EmailValidator;
})();
//# sourceMappingURL=dataValidator.js.map