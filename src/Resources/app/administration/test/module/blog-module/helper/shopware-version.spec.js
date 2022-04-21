import swVersionHelper from 'plugin-admin/src/module/blog-module/helper/shopware-version.helper';

describe('versionCompare method', () => {
    it('should return 1 if the second is lower', () => {
        const result = swVersionHelper.versionCompare('1.5.7rc', '1.5.7a');
        expect(result).toBe(1);
    });

    it('should return 1 if the second is not recognized', () => {
        const result = swVersionHelper.versionCompare('6.4', '..');
        expect(result).toBe(1);
    });

    it('should return 1 if the second is empty', () => {
        const result = swVersionHelper.versionCompare('6.4', '');
        expect(result).toBe(1);
    });

    it('should return 0 if they are equal', () => {
        const result = swVersionHelper.versionCompare('6.4.0', '6.4.0');
        expect(result).toBe(0);
    });

    it('should return 1 if the first version is lower than the second', () => {
        const result = swVersionHelper.versionCompare('6.3.0dev', '6.3.0');
        expect(result).toBe(-1);
    });

    it('should return true if the relationship is the one specified by the operator: less than', () => {
        const resultLessThanSymbol = swVersionHelper.versionCompare('6.4', '6.5', '<');
        const resultLessThanLetter = swVersionHelper.versionCompare('6.4', '6.5', 'lt');

        expect(resultLessThanSymbol).toBeTruthy();
        expect(resultLessThanLetter).toBeTruthy();
    });

    it('should return true if the relationship is the one specified by the operator: less than or equal', () => {
        const resultLessThanOrEqualSymbol = swVersionHelper.versionCompare('6.4', '6.5', '<=');
        const resultLessThanOrEqualLetter = swVersionHelper.versionCompare('6.5', '6.5', 'le');

        expect(resultLessThanOrEqualSymbol).toBeTruthy();
        expect(resultLessThanOrEqualLetter).toBeTruthy();
    });

    it('should return true if the relationship is the one specified by the operator: greater than', () => {
        const resultGreaterThanSymbol = swVersionHelper.versionCompare('6.4', '6.3', '>');
        const resultGreaterThanLetter = swVersionHelper.versionCompare('6.4', '6.3', 'gt');

        expect(resultGreaterThanSymbol).toBeTruthy();
        expect(resultGreaterThanLetter).toBeTruthy();
    });

    it('should return true if the relationship is the one specified by the operator: greater than or equal', () => {
        const resultGreaterThanOrEqualSymbol = swVersionHelper.versionCompare('6.4', '6.3', '>=');
        const resultGreaterThanOrEqualLetter = swVersionHelper.versionCompare('6.4', '6.4', 'ge');

        expect(resultGreaterThanOrEqualSymbol).toBeTruthy();
        expect(resultGreaterThanOrEqualLetter).toBeTruthy();
    });

    it('should return true if the relationship is the one specified by the operator: not equal', () => {
        const resultNotEqualSymbol1 = swVersionHelper.versionCompare('6.4', '6.5', '<>');
        const resultNotEqualSymbol2 = swVersionHelper.versionCompare('6.4', '6.5', '!==');
        const resultNotEqualLetter = swVersionHelper.versionCompare('6.4', '6.5', 'ne');

        expect(resultNotEqualSymbol1).toBeTruthy();
        expect(resultNotEqualSymbol2).toBeTruthy();
        expect(resultNotEqualLetter).toBeTruthy();
    });

    it('should return true if the relationship is the one specified by the operator: equal', () => {
        const resultEqualSymbol1 = swVersionHelper.versionCompare('6.4', '6.4', '===');
        const resultEqualSymbol2 = swVersionHelper.versionCompare('6.4', '6.4', '=');
        const resultEqualLetter = swVersionHelper.versionCompare('6.4', '6.4', 'eq');

        expect(resultEqualSymbol1).toBeTruthy();
        expect(resultEqualSymbol2).toBeTruthy();
        expect(resultEqualLetter).toBeTruthy();
    });

    it('should return null if the operator is not recognized', () => {
        const result = swVersionHelper.versionCompare('6.4', '6.4', '!');
        expect(result).toBeNull();
    });

    it('should handle pre zero version', () => {
        const result = swVersionHelper.versionCompare('1.5.7.02', '1.05.7.01');
        expect(result).toBe(1);
    });
});

describe('versionGTE method', () => {

    beforeEach(() => {
        global.Shopware = {
            Context: {
                app: {
                    config: {
                        version: '6.4.10',
                    },
                },
            },
        };
    });

    it('should return true shopware version is greater than the given version', () => {
        const result = swVersionHelper.versionGTE('6.4.0');
        expect(result).toBeTruthy();
    });

    it('should return true shopware version is equal the given version', () => {
        const result = swVersionHelper.versionGTE('6.4.10');
        expect(result).toBeTruthy();
    });

    it('should return false shopware version is lower than the given version', () => {
        const result = swVersionHelper.versionGTE('6.5');
        expect(result).toBeFalsy();
    });
});
