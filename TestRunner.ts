class TestRunner {

    constructor(public logger: Logger) {
    }

    runTests() {
        $('#log').html('<div></div>');
        this.testValidationUtil();
        this.testTitle();
        this.testFirstName();
        this.testLastName();
        this.testEmail();
    }

    expect(result: any, expected: any, name: string) {
        if (result !== expected) {
            this.logger.logFailure(`Internal Failure: ${name} was ${result} but should be ${expected}`);
        }
    }

    /** Test cases that are important to us, but not to users */
    testValidationUtil() {
        var test = (list: any, name: string, func: any) => {
            _.each(list, testCase => {
                var result = func(testCase[0]);
                this.expect(result, testCase[1], `${name}(${testCase[0]})`);
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
        var invalidTestCases = _.map(invalidChars, x => [x, false]);

        var upperTestCases = invalidTestCases
            .concat(_.map(upperChars, x => [x, true]))
            .concat(_.map(lowerChars, x => [x, false]));

        var lowerTestCases = invalidTestCases
            .concat(_.map(upperChars, x => [x, false]))
            .concat(_.map(lowerChars, x => [x, true]));

        test(upperTestCases, "ValidationUtil.IsUpperCase", ValidationUtil.IsUpperCaseChar);
        test(lowerTestCases, "ValidationUtil.IsLowerCase", ValidationUtil.IsLowerCaseChar);
    }

    log(validatorName: string, data: string, expected: boolean, success: boolean) {
        var expectedMsg = expected ? "Valid" : "Invalid";
        
        if (success) {
            var msg = `${validatorName} of "${data}" was correctly marked as ${expectedMsg}`;
            this.logger.logSuccess(msg);
        } else {
            var msg = `${validatorName} of "${data}" was expected to be ${expectedMsg}`;
            this.logger.logFailure(msg);
        }
    }

    getTestFunc(validator: ColumnValidator, validatorName: string) {
        return (name: string, expectedResult: boolean) => {
            var errMsg = validator.validate({ x: name });
            var actual = errMsg === '' || errMsg === undefined;
            var success = (expectedResult === actual);
            this.log(validatorName, name, expectedResult, success);
        };
    }

    testTitle() {
        var validator = new TitleValidator("x");
        var test = this.getTestFunc(validator, "Title");

        test("A Walk in the Best Of", true);
        test("Joining The Navy", false);
        test("a Walk", false);
        test("Dr. Dolittle", true);
        test("VP, Corporate Planning & Real estate", false);
        test("VP, Corporate Planning & Real Estate", true);
        test("CEO", true);
    }

    testFirstName() {
        var validator = new FirstNameValidator("x");
        var test = this.getTestFunc(validator, "FirstName");
        
        test("A.", true);
        test("RG.", false);
        test("Pr'yon", false);
        test("jamie", false);
        test("Johann", true);
        test("Mike", true);
        //test('LaShawn', true);
    }

    testLastName() {
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
    }

    testEmail() {
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
    }

}