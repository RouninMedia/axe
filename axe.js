// CONVERT STYLESHEET INTO ARRAY

var stylesheets = document.getElementsByTagName('style');

for (var i = 0; i < stylesheets.length; i++) {

    var stylesheet = stylesheets[i].textContent;
    stylesheet = stylesheet.replace(/\n/g,' ');
    stylesheet = stylesheet.replace(/\/\*.*\*\//g,'');
    stylesheet = stylesheet.replace(/[\s]*{/g,'{');
    stylesheet = stylesheet.replace(/[\s]*}/g,'}');
    stylesheet = stylesheet.replace(/{[\s]*/g,'{');
    stylesheet = stylesheet.replace(/}[\s]*/g,'}');

    var stylesheet = stylesheet.split(/{|}|;/);
    var stylesheetRules = [];
    var ruleIndex = 0;

    for (var j = 0; j < stylesheet.length; j++) {

        if (!stylesheet[j].match(/(^$|^\s+$)/g)) {

            if (!stylesheet[j].match(/\:/g) ||
            	 stylesheet[j].match(/\:\:/g) ||
            	 stylesheet[j].match(/\:nth/g) ||
            	 stylesheet[j].match(/\:first/g) ||
            	 stylesheet[j].match(/\:last/g) ||
            	 stylesheet[j].match(/\:link/g) ||
            	 stylesheet[j].match(/\:visited/g) ||
            	 stylesheet[j].match(/\:hover/g) ||
            	 stylesheet[j].match(/\:active/g) ||
            	 stylesheet[j].match(/\:focus/g) ||
            	 stylesheet[j].match(/\:target/g)) {
        	    stylesheetRules[stylesheetRules.length] = ruleIndex;
        	    ruleIndex++;
            }

            stylesheetRules[stylesheetRules.length] = stylesheet[j].replace(/([\s]*:[\s]*)/,':').trim();
        }
    }

    console.log(stylesheetRules);

    // BUILD AXE RULES OBJECT

    var axe = {};
    axe.rules = [];
    var axeRuleIndex = 0;
    var identifiers = ['element','class','id'];
    var labels = ['nodeName','className','id'];
    var symbols = ['<','^','%','|','?','!'];
    var selectors = ['ancestor-immediate', 'ancestor-all', 'sibling-immediate', 'sibling-all', 'sibling-immediate-previous', 'sibling-all-previous'];

    for (var j = 0; j < stylesheetRules.length; j++) {

        if ((typeof stylesheetRules[j] === 'number') && (stylesheetRules[(j+1)].match(/(\<|\^|\?|\!|\%|\|)/))) {

            var axeSymbol;
	        if (stylesheetRules[(j+1)].match(/\</)) {axeSymbol = '<';}
	        if (stylesheetRules[(j+1)].match(/\^/)) {axeSymbol = '^';}
	        if (stylesheetRules[(j+1)].match(/\?/)) {axeSymbol = '?';}
	        if (stylesheetRules[(j+1)].match(/\!/)) {axeSymbol = '!';}
	        if (stylesheetRules[(j+1)].match(/\%/)) {axeSymbol = '%';}
	        if (stylesheetRules[(j+1)].match(/\|/)) {axeSymbol = '|';}

            var k = j + 2;
            var styles = {};

            while (typeof stylesheetRules[k] === 'string') {
            	var property = stylesheetRules[k].substring(0,stylesheetRules[k].indexOf(':'));
            	var value = stylesheetRules[k].substring((stylesheetRules[k].indexOf(':') + 1));
            	styles[property] = value;
                k++;
            }

            axe.rules[axeRuleIndex] = {};
            var axeRule = axe.rules[axeRuleIndex];

            axeRule['index'] = stylesheetRules[j];
            axeRule['selector'] = stylesheetRules[(j+1)];
            axeRule['symbol'] = axeSymbol;
            axeRule['styles'] = styles;
            axeRule['type'] = selectors[symbols.indexOf(axeRule.symbol)];

            axeRule['origin'] = {};
            axeRule['operand'] = {};

            axeRule.origin['node'] = axeRule.selector.substring(0,axeRule.selector.indexOf(axeSymbol)).trim();
            axeRule.operand['node'] = axeRule.selector.substring((axeRule.selector.indexOf(axeSymbol)) + 1).trim();
    
            axeRule.origin['type'] = 0;
            axeRule.operand['type'] = 0;

            switch (axeRule.origin.node.substring(0,1)) {
                case ('.') : axeRule.origin.type = 1; break;
                case ('#') : axeRule.origin.type = 2; break;
            }

            switch (axeRule.operand.node.substring(0,1)) {
                case ('.') : axeRule.operand.type = 1; break;
                case ('#') : axeRule.operand.type = 2; break;
            }
    
            axeRule.origin['identifier'] = identifiers[axeRule.origin.type];
            axeRule.operand['identifier'] = identifiers[axeRule.origin.type];

            axeRule.origin['name'] = (axeRule.origin.type === 0 ? axeRule.origin.node : axeRule.origin.node.substring(1));
            axeRule.operand['name'] = (axeRule.operand.type === 0 ? axeRule.operand.node.toUpperCase() : axeRule.operand.node.substring(1));

            axeRuleIndex++;
        }
    }
}

console.log(axe);

function styleString(styleObject) {
    var styleString = '';

    Object.keys(styleObject).forEach(function(property){
        styleString += property + ':' + styleObject[property] + '; ';
    });
    
    return styleString;
}


function ancestorImmediate(axeRule) {
    var originNodes = document.querySelectorAll(axeRule.origin.node);
        
    for (var j = 0; j < originNodes.length; j++) {

        var parent = originNodes[j].parentNode;

        if (parent[labels[axeRule.operand.type]] === axeRule.operand.name) {
            parent.setAttribute('data-axe-selector', axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name);
        }
    }

    document.styleSheets[0].insertRule('[data-axe-selector="' + axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name + '"] {' + styleString(axeRule.styles) + '}',axeRule.index);

console.log(document.styleSheets[0].cssRules[0]);
console.log(document.styleSheets[0].cssRules[7]);

}


function ancestorAll(axeRule) {
    var originNodes = document.querySelectorAll(axeRule.origin.node);
        
    for (var j = 0; j < originNodes.length; j++) {

        var ancestors = [];
        var ancestor = originNodes[j].parentNode;

        while (ancestor.nodeName !== 'HTML') {
            ancestors[(ancestors.length)] = ancestor;
            ancestor = ancestor.parentNode;
        }

        for (var k = 0; k < ancestors.length; k++) {
            if (ancestors[k][labels[axeRule.operand.type]] === axeRule.operand.name) {
                ancestors[k].setAttribute('data-axe-selector', axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name);
            }
        }
    }

    document.styleSheets[0].insertRule('[data-axe-selector="' + axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name + '"] {' + styleString(axeRule.styles) + '}',axeRule.index);
}


function siblingImmediatePrevious(axeRule) {
    var originNodes = document.querySelectorAll(axeRule.origin.node);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] !== originNodes[j].previousElementSibling) continue;
            if (siblings[k] === originNodes[j]) break;

            if (siblings[k][labels[axeRule.operand.type]] === axeRule.operand.name) {
                siblings[k].setAttribute('data-axe-selector', axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name);
            }
        }
    }

    document.styleSheets[0].insertRule('[data-axe-selector="' + axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name + '"] {' + styleString(axeRule.styles) + '}',axeRule.index);
}


function siblingAllPrevious(axeRule) {
    var originNodes = document.querySelectorAll(axeRule.origin.node);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] === originNodes[j]) break;

            if (siblings[k][labels[axeRule.operand.type]] === axeRule.operand.name) {
                siblings[k].setAttribute('data-axe-selector', axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name);
            }
        }
    }

    document.styleSheets[0].insertRule('[data-axe-selector="' + axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name + '"] {' + styleString(axeRule.styles) + '}',axeRule.index);
}


function siblingImmediate(axeRule) {
    var originNodes = document.querySelectorAll(axeRule.origin.node);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] === originNodes[j]) continue;
            if ((siblings[k] !== originNodes[j].previousElementSibling) && (siblings[k] !== originNodes[j].nextElementSibling)) continue;

            if (siblings[k][labels[axeRule.operand.type]] === axeRule.operand.name) {
                siblings[k].setAttribute('data-axe-selector', axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name);
            }
        }
    }

    document.styleSheets[0].insertRule('[data-axe-selector="' + axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name + '"] {' + styleString(axeRule.styles) + '}',axeRule.index);
}


function siblingAll(axeRule) {
    var originNodes = document.querySelectorAll(axeRule.origin.node);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] === originNodes[j]) continue;

            if (siblings[k][labels[axeRule.operand.type]] === axeRule.operand.name) {
                siblings[k].setAttribute('data-axe-selector', axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name);
            }
        }
    }

    document.styleSheets[0].insertRule('[data-axe-selector="' + axeRule.origin.identifier + '-' + axeRule.origin.name + '_' + axeRule.type + '_' + axeRule.operand.identifier + '-' + axeRule.operand.name + '"] {' + styleString(axeRule.styles) + '}',axeRule.index);
}


for (var i = 0; i < axe.rules.length; i++) {

    var axeRule = axe.rules[i];

    switch (axeRule.symbol) {
        case ('<') : ancestorImmediate(axeRule); break;
        case ('^') : ancestorAll(axeRule); break;
        case ('%') : siblingImmediate(axeRule); break;
        case ('|') : siblingAll(axeRule); break;
        case ('?') : siblingImmediatePrevious(axeRule); break;
        case ('!') : siblingAllPrevious(axeRule); break;
    }
}
