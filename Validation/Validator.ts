class Validator {
    constructor(private logger: Logger) { }

    validate(csvData) {
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
            msg += _.map(validators, v => _.escape(v.columnName)).join(', ');
            this.logger.setLogTitle(msg);
            for (var i = 0; i < csvData.length; i++) {
                rowNum = i + 2;
                this.checkValidationErrors(rowNum, csvData[i], validators);
            }
            this.logger.log('Done! ' + csvData.length + ' rows validated!');
        } catch (e) {
            this.logger.logFailure(`Row ${rowNum}: ERROR! ` + e.stack || e.toString());
        }        
    }

    checkValidationErrors(rowNum: number, row: any, validators: ColumnValidator[]) {
        _.each(validators, validator => {
            var v = validator.validate(row);
            if (v) {
                this.logger.logFailure(`Row ${rowNum}: ${v}`);
            }
        });
    }

    getValidators(csvData: any) {
        var colNames = _.keys(csvData[0]);
        var validators = [];
        _.each(colNames, col => {
            var validator = this.getValidatorForColumn(col);
            if (validator) {
                validators.push(validator);
            }
        });
        return validators;
    }

    getValidatorForColumn(colName: string) {
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
    }
}

interface ColumnValidator {
    validate(row: any);
}

class FirstNameValidator implements ColumnValidator {
    constructor(public columnName: string) { }

    validate(row: any) {
        var data = row[this.columnName];
        if (!data) {
            return `${this.columnName} was empty`;
        }

        //if (data.length > 3 && data.match(/\s[A-Z]\.$/)) {
        //    data = data.substring(0, data.length - 3);
        //}

        if (ValidationUtil.IsInitial(data)) {
            return;
        }

        if (data.match(/\s/)) {
            return `${this.columnName} has funny white space: "${data}"`;
        }

        var known = ValidationUtil.IsKnownFirstName(data);

        if (!known && !ValidationUtil.IsTitleCase(data)) {
            return `${this.columnName} not title case: "${data}"`;
        }

        //if (!known) {
        //    return `${this.columnName} contains unknown first name: "${data}"`;
        //}

        if (!data.match(/^[A-Za-z\.]*$/)) {
            return `${this.columnName} has unusual characters: "${data}"`;
        }
    }
}

class LastNameValidator implements ColumnValidator {
    constructor(public columnName: string) { }

    validate(row: any): string {
        var data: string = row[this.columnName];
        if (!data) {
            return `${this.columnName} was empty`;
        }

        var isHyphenated = data.indexOf('-') >= 0;

        if (!isHyphenated) {
            if (!this.validateLastName(data)) {
                return `${this.columnName} looks suspicious: "${data}"`;
            } else {
                return;
            }
        }

        var nameParts = data.split('-');
        if (nameParts.length !== 2) {
            return `${this.columnName} too many hyphens: "${data}"`;
        }

        var looksValid = _.every(nameParts, part => this.validateLastName(part));
        if (!looksValid) {
            return `${this.columnName} looks suspicious: "${data}"`;
        }

        if (!data.match(/^[A-Za-z\.\-']*$/)) {
            return `${this.columnName} has unusual characters: "${data}"`;
        }
    }

    validateLastName(lastName: string) {
        if (ValidationUtil.IsKnownLastName(lastName)) { return true; }

        if (ValidationUtil.IsTitleCase(lastName)) { return true; }

        var simpleName = ValidationUtil.StripLastNamePrefix(lastName);

        return ValidationUtil.IsTitleCase(simpleName);
    }
}

class TitleValidator implements ColumnValidator {
    constructor(public columnName: string) { }

    static symbolRegex = /, |\/| - | – | & |-|–|&/g;

    validate(row: any) {
        var data: string = row[this.columnName];
        if (!data) {
            return `${this.columnName} was empty`;
        }

        var str = data.replace(TitleValidator.symbolRegex, ' ');

        var filteredParts = _.filter(str.split(' '), x => x);
        
        var startsWithFirstPart = data.indexOf(filteredParts[0]) === 0;
        var lastPart = _.last(filteredParts);
        var endsWithLastPart = data.indexOf(lastPart) === data.length - lastPart.length;

        if (!startsWithFirstPart || !endsWithLastPart || _.some(filteredParts, p => !p || p.match(/\s/))) {
            return `${this.columnName} has funny white spacing: "${data}"`;
        }

        if (!ValidationUtil.IsTitleCaseOrAcronymPhrase(filteredParts)) {
            return `${this.columnName} not in title case: "${data}"`;
        }

        if (_.some(filteredParts, part => !part.match(/^[A-Za-z\.\(\)]*$/))) {
            return `${this.columnName} has unusual characters: "${data}"`;
        }
    }
}

class EmailValidator implements ColumnValidator {
    constructor(public columnName: string) { }

    validate(row: any) {
        var data = row[this.columnName];
        if (!data) {
            return `${this.columnName} was empty`;
        }
        if (data.match(/\s/)) {
            return `${this.columnName} contains white space: "${data}"`;
        }

        if (ValidationUtil.IsSuspiciousLookingEmail(data)) {
            return `${this.columnName} looks suspicious: "${data}"`;
        }

        if (!data.match(/^[A-Za-z0-9\-_\.@]*$/)) {
            return `${this.columnName} has unusual characters: "${data}"`; 
        }
    }
}