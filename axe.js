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
    var symbols = ['<','^','%','|','?','!'];

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
            axeRule['axeselector'] = [stylesheetRules[(j+1)]];
            axeRule['symbol'] = axeSymbol;
            axeRule['styles'] = styles;

            axeRule['origin'] = {};
            axeRule['operand'] = {};

            axeRule.origin['selector'] = axeRule.axeselector[0].substring(0,axeRule.axeselector[0].indexOf(axeSymbol)).trim();
            axeRule.operand['selector'] = axeRule.axeselector[0].substring((axeRule.axeselector[0].indexOf(axeSymbol)) + 1).trim();

            var operandSelectorString = axeRule.operand['selector'];
            operandSelectorString = operandSelectorString.replace(/(\w)\s+([\w|\.|\#])/g,'$1; ;$2');
            operandSelectorString = operandSelectorString.replace(/(\w)\s*?([\>|\+|\~|\<|\^|\?|\!|\%|\|])\s*?([\w|\.|\#])/g,'$1;$2;$3');
            axeRule.operand.selector = operandSelectorString.split(';');

            axeRule.axeselector[1] = axeRule.origin.selector + ' ' + axeRule.symbol +  ' ' + axeRule.operand.selector[0];





            if (axeRule.operand.selector.length > 1) {
                var a = 1;
                var b = 2;
                axeRule.axeselector[b] = '';

                while (a < axeRule.operand.selector.length) {

                    if (symbols.indexOf(axeRule.operand.selector[a]) > -1) {
                        b++;
                        axeRule.axeselector[b] = '';
                    }

                    axeRule.axeselector[b] += ' ' + axeRule.operand.selector[a] + ' ';
                    a++;
                }
            }
            
            axeRuleIndex++;
        }
    }
}

console.log(axe);


function nodeProperties(node) {
    var nodeProperties = {};
    
    switch (node.substring(0,1)) {
        case ('#') :
            nodeProperties['type'] = 2;
            nodeProperties['name'] = node.substring(1);
            nodeProperties['label'] = 'id';
            break;

        case ('.') :
            nodeProperties['type'] = 1;
            nodeProperties['name'] = node.substring(1);
            nodeProperties['label'] = 'className';
            break;

        default :
            nodeProperties['type'] = 0;
            nodeProperties['name'] = node.toUpperCase();
            nodeProperties['label'] = 'nodeName';
    }

    return nodeProperties;
}


function activateSymbol(symbol, node) {
    var targetElements = [];

    switch (symbol) {
        case ('<') : targetElements[0] = ancestorImmediate(node); break;
        case ('^') : targetElements = ancestorAll(node); break;
        case ('%') : targetElements = siblingImmediate(node); break;
        case ('|') : targetElements = siblingAll(node); break;
        case ('?') : targetElements[0] = siblingImmediatePrevious(node); break;
        case ('!') : targetElements = siblingAllPrevious(node); break;
    }

    return targetElements;
}


function selectorString(selectorArray) {
    var selectorString = '';
    selectorString += selectorArray[2];
    return selectorString;
}


function styleString(styleObject) {
    var styleString = '';

    Object.keys(styleObject).forEach(function(property){
        styleString += property + ':' + styleObject[property] + '; ';
    });
    
    return styleString;
}


function ancestorImmediate(element) {
    return element.parentNode;
}


function ancestorAll(element) {

    var allAncestors = [];
    var ancestor = element.parentNode;

    while (ancestor.nodeName !== 'HTML') {
        allAncestors[(allAncestors.length)] = ancestor;
        ancestor = ancestor.parentNode;
    }

    return allAncestors;
}


function siblingImmediatePrevious(element) {
    return element.previousElementSibling;
}


function siblingAllPrevious(element) {
    var s = 0;
    var allPreviousSiblings = [];

    for (var i = 0; i < element.parentNode.children.length; i++) {
        if (element.parentNode.children[i] === element) break;
        allPreviousSiblings[s] = element.parentNode.children[i];
        s++;
    }

    return allPreviousSiblings;
}


function siblingImmediate(element) {
    return [element.previousElementSibling, element.nextElementSibling];
}


function siblingAll(element) {
    var s = 0;
    var allSiblings = [];

    for (var i = 0; i < element.parentNode.children.length; i++) {
        if (element.parentNode.children[i] === element) continue;
        allSiblings[s] = element.parentNode.children[i];
        s++;
    }

    return allSiblings;
}


function axeStyle(axeRule) {
    var nodes = document.querySelectorAll(axeRule.origin.selector);

    for (var j = 0; j < nodes.length; j++) {

        var symbol = axeRule.symbol;
        var node = nodes[j];
        var targetElements = activateSymbol(symbol, node);

        targetElements.forEach(function(targetElement){
            if (targetElement[nodeProperties(axeRule.operand.selector[0]).label] === nodeProperties(axeRule.operand.selector[0]).name) {
                targetElement.setAttribute('data-axeselector', axeRule.axeselector[1]);
            }
        });
    }

    if (axeRule.axeselector.length < 4) {
        document.styleSheets[0].insertRule('[data-axeselector="' + axeRule.axeselector[1] + '"]' + selectorString(axeRule.axeselector) + '{' + styleString(axeRule.styles) + '}', axeRule.index);
    }

    else { 
        var nodes = document.querySelectorAll('[data-axeselector="' + axeRule.axeselector[1] + '"]' + axeRule.axeselector[2]);

        for (var k = 0; k < nodes.length; k++) {
            nodes[k].setAttribute('data-axeselector', axeRule.axeselector[1] + axeRule.axeselector[2]);
                
            var symbol = axeRule.axeselector[3].trim().substring(0,1);
            var node = nodes[k];
            var targetElements = activateSymbol(symbol, node);

            targetElements.forEach(function(targetElement){
                if (targetElement[nodeProperties(axeRule.operand.selector[6]).label] === nodeProperties(axeRule.operand.selector[6]).name) {
                    targetElement.setAttribute('data-axeselector', axeRule.axeselector[1] + axeRule.axeselector[2] + axeRule.axeselector[3]);
                }
            });
        }

        if (axeRule.axeselector.length < 6) {
            document.styleSheets[0].insertRule('[data-axeselector="' + axeRule.axeselector[1] + axeRule.axeselector[2] + axeRule.axeselector[3] + '"]' + '{' + styleString(axeRule.styles) + '}', axeRule.index);
        }
    }

    /*
    for (var y = 0; y < document.styleSheets[0].cssRules.length; y++) {
        console.log(document.styleSheets[0].cssRules[y]);
    }
    */
}

axe.rules.forEach(function(axeRule){axeStyle(axeRule);});
