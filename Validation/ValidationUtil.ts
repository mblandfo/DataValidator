class ValidationUtil {

    static allowedLowerCaseStringMap = _.keyBy(['a', 'an', 'and', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']);
    
    static lastNamePrefixes = [ 'Mc', 'Mac', 'De', 'del ', 'van ', 'O\'', 'D\''];

    static accentedUpperCharacters = "ÀÈÌÒÙÁÉÍÓÚÝÂÊÎÔÛÃÑÕÄËÏÖÜŸ";
    static accentedLowerCharacters = "áéíóúýâêîôûãñõäëïöüÿ";

    static upperAccentMap = _.keyBy(ValidationUtil.accentedUpperCharacters, _.identity);
    static lowerAccentMap = _.keyBy(ValidationUtil.accentedLowerCharacters, _.identity);

    static IsInitial(str: string) {
        return str.length === 2 && ValidationUtil.IsUpperCaseChar(str[0]) && str[1] === '.';
    }

    /** This also counts abbreviations such as Dr. */
    static IsAcryonym(str: string) {
        if (str.length < 2) { return false; }

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

        return _.every(str, c => ValidationUtil.IsUpperCaseChar(c));
    }

    static IsUpperCaseChar(c: string) {
        return !!(c.match(/^[A-Z]$/) || ValidationUtil.upperAccentMap[c]);
    }

    static IsLowerCaseChar(c: string) {
        return !!(c.match(/^[a-z]$/) || ValidationUtil.lowerAccentMap[c]);
    }

    static IsTitleCase(str: string): boolean {
        if (str.length === 1) {
            return ValidationUtil.IsUpperCaseChar(str[0]);
        }

        return ValidationUtil.IsUpperCaseChar(str[0]) && _.every(str.substr(1), c => ValidationUtil.IsLowerCaseChar(c));
    }

    /** If it is the first or last word in a title, it must be title case. Otherwise, the above words are allowed to be lower case */
    private static IsTitleCaseMiddleWord(str: string) {
        if (ValidationUtil.allowedLowerCaseStringMap[str]) {
            return true;
        }
        if (ValidationUtil.allowedLowerCaseStringMap[str.toLowerCase()]) {
            return false;
        }
        return ValidationUtil.IsTitleCase(str);
    }

    static IsTitleCaseOrAcronymPhrase(phrase: string[]) {
        if (phrase.length <= 2) {
            return _.every(phrase, word => ValidationUtil.IsAcryonym(word) || ValidationUtil.IsTitleCase(word));
        }
        for (var i = 0; i < phrase.length; i++) {
            if (ValidationUtil.IsAcryonym(phrase[i])) {
                continue;
            }
            if (i === 0 || i === phrase.length - 1) {
                if (!ValidationUtil.IsTitleCase(phrase[i])) {
                    return false;
                }
            } else {
                if (!ValidationUtil.IsTitleCaseMiddleWord(phrase[i])) {
                    return false;
                }
            }
        }
        return true;
    }

    static GetEmailDomain(email: string) {
        var idx = email.indexOf("@");
        if (idx < 0 || idx == email.length - 1) { return ""; }

        return email.substring(idx + 1);
    }

    static StripLastNamePrefix(lastName: string) {
        var prefixes = ValidationUtil.lastNamePrefixes;
        for (var i = 0; i < prefixes.length; i++) {
            var prefix = prefixes[i];
            if (lastName.indexOf(prefix) === 0 && lastName.length > prefix.length) {
                return lastName.substr(prefix.length);
            }
        }
        return lastName;
    }

    static IsKnownLastName(str: string) {
        var data = nameData[str];
        return data & 2;
    }

    static IsKnownFirstName(str: string) {
        var data = nameData[str];
        return data & 1;
    }
    
    static IsSuspiciousLookingEmail(email: string) {
        var re = /\S+@\S+\.\S+/;
        return !re.test(email);
    }
}