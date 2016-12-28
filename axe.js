// CONVERT STYLESHEET INTO ARRAY

var stylesheets = document.getElementsByTagName('style');

for (var i = 0; i < stylesheets.length; i++) {

    var stylesheet = stylesheets[i].textContent;
    stylesheet = stylesheet.replace(/\n/g,' ');
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


    // BUILD AXE RULES OBJECT

    var axe = {};
    axe.rules = [];
    var axeRuleIndex = 0;  

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
            axe.rules[axeRuleIndex]['index'] = stylesheetRules[j];
            axe.rules[axeRuleIndex]['selector'] = stylesheetRules[(j+1)];
            axe.rules[axeRuleIndex]['symbol'] = axeSymbol;
            axe.rules[axeRuleIndex]['originNode'] = axe.rules[axeRuleIndex].selector.substring(0,axe.rules[axeRuleIndex].selector.indexOf(axeSymbol)).trim();
            axe.rules[axeRuleIndex]['operandNode'] = axe.rules[axeRuleIndex].selector.substring((axe.rules[axeRuleIndex].selector.indexOf(axeSymbol)) + 1).trim();
            axe.rules[axeRuleIndex]['styles'] = styles;
            axeRuleIndex++;
        }
    }
}



function axeImmediateParent(axeRule, originType, operandType) {
    var originNodes = document.querySelectorAll(axeRule.originNode);
        
    for (var j = 0; j < originNodes.length; j++) {
        
        if (((operandType === 'element') && (originNodes[j].parentNode.nodeName === axeRule.operandNode.toUpperCase())) ||
            ((operandType === 'class') && (originNodes[j].parentNode.className === axeRule.operandNode.substring(1))) ||
            ((operandType === 'id') && (originNodes[j].parentNode.id === axeRule.operandNode.substring(1)))) {

            Object.keys(axeRule.styles).forEach(function(property){
                originNodes[j].parentNode.style[property] = axeRule.styles[property];
            });
        }
    }
}


function axeAllAncestors(axeRule, originType, operandType) {
    var originNodes = document.querySelectorAll(axeRule.originNode);
        
    for (var j = 0; j < originNodes.length; j++) {

        var ancestors = [];
        var ancestor = originNodes[j].parentNode;

        while (ancestor.nodeName !== 'HTML') {
            ancestors[(ancestors.length)] = ancestor;
            ancestor = ancestor.parentNode;
        }

        for (var k = 0; k < ancestors.length; k++) {
            if (((operandType === 'element') && (ancestors[k].nodeName === axeRule.operandNode.toUpperCase())) ||
                ((operandType === 'class') && (ancestors[k].className === axeRule.operandNode.substring(1))) ||
                ((operandType === 'id') && (ancestors[k].id === axeRule.operandNode.substring(1)))) {
                Object.keys(axeRule.styles).forEach(function(property){
                    ancestors[k].style[property] = axeRule.styles[property];
                });
            }
        }
    }
}


function axeImmediatePreviousSibling(axeRule, originType, operandType) {
    var originNodes = document.querySelectorAll(axeRule.originNode);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] !== originNodes[j].previousElementSibling) continue;
            if (siblings[k] === originNodes[j]) break;

            if (((operandType === 'element') && (siblings[k].nodeName === axeRule.operandNode.toUpperCase())) ||
                ((operandType === 'class') && (siblings[k].className === axeRule.operandNode.substring(1))) ||
                ((operandType === 'id') && (siblings[k].id === axeRule.operandNode.substring(1)))) {
                
                Object.keys(axeRule.styles).forEach(function(property){
                    siblings[k].style[property] = axeRule.styles[property];
                });

            }
        }
    }
}


function axeAllPreviousSiblings(axeRule, originType, operandType) {
    var originNodes = document.querySelectorAll(axeRule.originNode);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] === originNodes[j]) break;

            if (((operandType === 'element') && (siblings[k].nodeName === axeRule.operandNode.toUpperCase())) ||
                ((operandType === 'class') && (siblings[k].className === axeRule.operandNode.substring(1))) ||
                ((operandType === 'id') && (siblings[k].id === axeRule.operandNode.substring(1)))) {

                Object.keys(axeRule.styles).forEach(function(property){
                    siblings[k].style[property] = axeRule.styles[property];
                });

            }
        }
    }
}


function axeImmediateSiblings(axeRule, originType, operandType) {
    var originNodes = document.querySelectorAll(axeRule.originNode);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] === originNodes[j]) continue;
            if ((siblings[k] !== originNodes[j].previousElementSibling) && (siblings[k] !== originNodes[j].nextElementSibling)) continue;

            if (((operandType === 'element') && (siblings[k].nodeName === axeRule.operandNode.toUpperCase())) ||
                ((operandType === 'class') && (siblings[k].className === axeRule.operandNode.substring(1))) ||
                ((operandType === 'id') && (siblings[k].id === axeRule.operandNode.substring(1)))) {
                Object.keys(axeRule.styles).forEach(function(property){
                    siblings[k].style[property] = axeRule.styles[property];
                });

            }
        }
    }
}


function axeAllSiblings(axeRule, originType, operandType) {
    var originNodes = document.querySelectorAll(axeRule.originNode);
        
    for (var j = 0; j < originNodes.length; j++) {

        var siblings = originNodes[j].parentNode.children;

        for (var k = 0; k < siblings.length; k++) {
            if (siblings[k] === originNodes[j]) continue;

            if (((operandType === 'element') && (siblings[k].nodeName === axeRule.operandNode.toUpperCase())) ||
                ((operandType === 'class') && (siblings[k].className === axeRule.operandNode.substring(1))) ||
                ((operandType === 'id') && (siblings[k].id === axeRule.operandNode.substring(1)))) {
                Object.keys(axeRule.styles).forEach(function(property){
                    siblings[k].style[property] = axeRule.styles[property];
                });

            }
        }
    }
}


for (var i = 0; i < axe.rules.length; i++) {

    var originType = 'element';
    var operandType = 'element';

    switch (axe.rules[i].originNode.substring(0,1)) {
        case ('.') : originType = 'class'; break;
        case ('#') : originType = 'id'; break;
    }

    switch (axe.rules[i].operandNode.substring(0,1)) {
        case ('.') : operandType = 'class'; break;
        case ('#') : operandType = 'id'; break;
    }

	var axeRule = axe.rules[i];
	if (axeRule.selector.match(/\</g)) {axeImmediateParent(axeRule, originType, operandType);}
	if (axeRule.selector.match(/\^/g)) {axeAllAncestors(axeRule, originType, operandType);}
	if (axeRule.selector.match(/\?/g)) {axeImmediatePreviousSibling(axeRule, originType, operandType);}
	if (axeRule.selector.match(/\!/g)) {axeAllPreviousSiblings(axeRule, originType, operandType);}
	if (axeRule.selector.match(/\%/g)) {axeImmediateSiblings(axeRule, originType, operandType);}
	if (axeRule.selector.match(/\|/g)) {axeAllSiblings(axeRule, originType, operandType);}
}
