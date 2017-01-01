// CONVERT STYLESHEET INTO ARRAY

var stylesheets = document.getElementsByTagName('style');

for (var i = 0; i < stylesheets.length; i++) {

    var stylesheet = stylesheets[i].textContent;
    stylesheet = stylesheet.replace(/\n/g,' ');
    stylesheet = stylesheet.replace(/\/\*.*?\*\//g,'');
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

            axe.rules[axeRuleIndex] = {};
            var axeRule = axe.rules[axeRuleIndex];
            axeRule['index'] = stylesheetRules[j];
            axeRule['axeselector'] = [stylesheetRules[(j+1)]];

            var s = 0;
            while (symbols.indexOf(stylesheetRules[(j+1)][s]) === -1) {s++;}
            axeRule['symbol'] = symbols[symbols.indexOf(stylesheetRules[(j+1)][s])];

            var k = j + 2;
            var styles = {};

            while (typeof stylesheetRules[k] === 'string') {
                var property = stylesheetRules[k].substring(0,stylesheetRules[k].indexOf(':'));
                var value = stylesheetRules[k].substring((stylesheetRules[k].indexOf(':') + 1));
                styles[property] = value;
                k++;
            }

            axeRule['styles'] = styles;

            axeRule['origin'] = {};
            axeRule['operand'] = {};

            axeRule.origin['selector'] = axeRule.axeselector[0].substring(0,axeRule.axeselector[0].indexOf(axeRule.symbol)).trim();
            axeRule.operand['selector'] = axeRule.axeselector[0].substring((axeRule.axeselector[0].indexOf(axeRule.symbol)) + 1).trim();

            var operandSelectorString = axeRule.operand['selector'];
            operandSelectorString = operandSelectorString.replace(/(\w)\s+([\w|\.|\#])/g,'$1; ;$2');
            operandSelectorString = operandSelectorString.replace(/(\w)\s*?([\>|\+|\~|\<|\^|\?|\!|\%|\|])\s*?([\w|\.|\#])/g,'$1;$2;$3');
            axeRule.operand.selector = operandSelectorString.split(';');

            axeRule.axeselector[1] = axeRule.origin.selector + ' ' + axeRule.symbol +  ' ' + axeRule.operand.selector[0];


  
            if (axeRule.operand.selector.length > 1) {
                var axeSelectorString = '';

                for (var a = 1; a < axeRule.operand.selector.length; a++) {

                    if (symbols.indexOf(axeRule.operand.selector[a]) > -1) {
                        axeSelectorString += ';' + ' ' + axeRule.operand.selector[a] + ' ' + axeRule.operand.selector[(a + 1)] + ';';
                        a++;
                    }
                    
                    else if ((axeRule.operand.selector[a] === ' ') || (axeRule.operand.selector[(a - 1)] === ' ')) {
                        axeSelectorString += axeRule.operand.selector[a];
                    }

                    else {
                        axeSelectorString += ' ' + axeRule.operand.selector[a];
                    }
                }

                var axeSelectorArray = axeSelectorString.split(';');
                
                for (var a = 0; a < axeSelectorArray.length; a++) {
                    axeRule.axeselector[(a + 2)] = axeSelectorArray[a];
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


function styleString(styleObject) {
    var styleString = '';

    Object.keys(styleObject).forEach(function(property){
        styleString += property + ':' + styleObject[property] + '; ';
    });
    
    return styleString;
}


function ancestorImmediate(element) {return element.parentNode;}
function siblingImmediatePrevious(element) {return element.previousElementSibling;}
function siblingImmediate(element) {return [element.previousElementSibling, element.nextElementSibling];}

function ancestorAll(element) {

    var allAncestors = [];
    var ancestor = element.parentNode;

    while (ancestor.nodeName !== 'HTML') {
        allAncestors[(allAncestors.length)] = ancestor;
        ancestor = ancestor.parentNode;
    }

    return allAncestors;
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


function getSelectorFragment(segment) {
    var i = 1;
    var selectorFragment = '[data-axeselector="';

    while (i < segment) {
        selectorFragment += axeRule.axeselector[i];
        i++;
    }

    selectorFragment += axeRule.axeselector[i];
    i++;

    selectorFragment += '"]' + (axeRule.axeselector[i] ? axeRule.axeselector[i] : '');
    return selectorFragment;
}


function axeStyle(axeRule) {
    var nodes = document.querySelectorAll(axeRule.origin.selector);
    var segment = 1;
    var selectorFragment = getSelectorFragment(segment);

    for (var j = 0; j < nodes.length; j++) {

        var symbol = axeRule.symbol;
        var node = nodes[j];
        var targetElements = activateSymbol(symbol, node);

        targetElements.forEach(function(targetElement){
            if (targetElement[nodeProperties(axeRule.operand.selector[0]).label] === nodeProperties(axeRule.operand.selector[0]).name) {
                targetElement.setAttribute('data-axeselector', axeRule.axeselector[segment]);
            }
        });
    }


    while (axeRule.axeselector.length > (segment + 2)) {
        var newSegment = (segment + 2);
        var nodes = document.querySelectorAll(selectorFragment);
        var currentAttribute = axeRule.axeselector[1];
        var nextAttribute = axeRule.axeselector[1];
        for (var a = 2; a < newSegment; a++) {currentAttribute += axeRule.axeselector[a];}
        for (var a = 2; a < (newSegment + 1); a++) {nextAttribute += axeRule.axeselector[a];}

        for (var k = 0; k < nodes.length; k++) {
            nodes[k].setAttribute('data-axeselector', currentAttribute);
            var symbol = axeRule.axeselector[newSegment].substring(1,2);
            var node = nodes[k];
            var targetElements = activateSymbol(symbol, node);
            var testtestNode = axeRule.axeselector[newSegment].substring(3);

            targetElements.forEach(function(targetElement){
                if (targetElement[nodeProperties(testtestNode).label] === nodeProperties(testtestNode).name) {
                    targetElement.setAttribute('data-axeselector', nextAttribute);
                }
            });
        }

        segment = newSegment;
        selectorFragment = getSelectorFragment(segment);
    }

    document.styleSheets[0].insertRule(selectorFragment + '{' + styleString(axeRule.styles) + '}', axeRule.index);
}

axe.rules.forEach(function(axeRule){axeStyle(axeRule);});
