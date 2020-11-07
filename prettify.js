module.exports = function(rules) {
    for (let rule of rules) {
        let ruleNumber = parseInt(rules.indexOf(rule) + 1);
        if (rule !== "There are no rules currently set.") {
            rules[rules.indexOf(rule)] = `**${ruleNumber}.** ${rule}`;
        }
    }
    return rules;
};
