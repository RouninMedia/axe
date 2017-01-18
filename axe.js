// CONVERT STYLESHEET INTO ARRAY

var forgedSelector = '';
var stylesheets = document.getElementsByTagName('style');


function separateQuery(query) {
    query = query.replace(/(\w)\s+([\w\.\#])/g,'$1; ;$2');
    query = query.replace(/(\w)\s*?([\>\+\~\<\^\?\!\%\|])\s*?([\w\.\#])/g,'$1;$2;$3');
    query = query.split(';');
    return query;
}


function forgeSelector(query) {

    forgedSelector = '';

    for (var a = 0; a < query.length; a++) {

        if (symbols.indexOf(query[a]) > -1) {

            if (symbols.indexOf(query[(a - 2)]) > -1) {
                forgedSelector += ';';
            }

            forgedSelector += ';' + ' ' + query[a] + ' ' + query[(a + 1)];
                    
            if ((a < (query.length - 2)) && (symbols.indexOf(query[(a + 2)]) < 0)) {
                forgedSelector += ';';
            }

            if (a < (query.length - 1)) {
                a++;
            }
        }
                    
        else if ((a === 0) || (query[a] === ' ') || (query[(a - 1)] === ' ')) {
            forgedSelector += query[a];
        }

        else {
            forgedSelector += ' ' + query[a];
        }

        if ((symbols.indexOf(query[(a - 1)]) < 0) && (query[a].indexOf(':hover') > -1) && (symbols.indexOf(query[(a + 1)]) < 0)) {
            forgedSelector += ';';

            if (symbols.indexOf(query[(a + 1)]) < 0) {
                forgedSelector += ';';
            }
        }
    }

    return forgedSelector;
}


for (var i = 0; i < stylesheets.length; i++) {

    var stylesheetText = stylesheets[i].textContent;
    stylesheetText = stylesheetText.replace(/\n/g,' ');
    stylesheetText = stylesheetText.replace(/\/\*.*?\*\//g,'');
    stylesheetText = stylesheetText.replace(/[\s]*{/g,'{');
    stylesheetText = stylesheetText.replace(/\;?[\s]*}/g,'}');
    stylesheetText = stylesheetText.replace(/{[\s]*/g,'{');
    stylesheetText = stylesheetText.replace(/}[\s]*/g,'}');

    var stylesheet = stylesheetText.split(/{|}|;/);
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

                // SEPARATE OUT COMMA-SEPARATED RULE-GROUPS

                if (stylesheet[j].match(/\,/g)) {
                    var ruleCount = (stylesheet[j].match(/\,/g).length + 1);
                    var ruleGroup = stylesheet[j].split(',');

                    for (var r = 0; r < ruleCount; r++) {
                        if (ruleGroup[r].match(/\?/) === null) {
                            var rulePosition = ((ruleIndex - 1) > document.styleSheets[0].cssRules.length ? document.styleSheets[0].cssRules.length : (ruleIndex - 1));
                            document.styleSheets[0].insertRule(ruleGroup[r] + '{' + stylesheet[(j + 1)] + '}', rulePosition);
                        }
                    }

                    for (var r = 0; r < ruleCount; r++) {
                        var splicePosition = ((r * 2) + 1);
                        ruleGroup.splice(splicePosition, 0, stylesheet[(j+1)]);
                    }

                    stylesheet.splice(j, 2, ...ruleGroup);
                }
            }

            stylesheetRules[stylesheetRules.length] = stylesheet[j].replace(/([\s]*:[\s]*)/,':').trim();
        }
    }


    console.log(stylesheetRules);


    // BUILD AXE RULES OBJECT

    var axe = {};
    axe['axeRules'] = [];
    var axeRuleIndex = 0;
    var symbols = ['<','^','%','|','?','!'];

    for (var j = 0; j < stylesheetRules.length; j++) {

        if ((typeof stylesheetRules[j] === 'number') && (stylesheetRules[(j+1)].match(/(\<|\^|\?|\!|\%|\|)/))) {

            axe.axeRules[axeRuleIndex] = {};
            var axeRule = axe.axeRules[axeRuleIndex];
            axeRule['axeIndex'] = stylesheetRules[j];
            var bronze = separateQuery(stylesheetRules[(j+1)]);
            forgeSelector(bronze);
            axeRule['axeSelector'] = forgedSelector.split(';');
            axeRule.axeSelector.unshift(stylesheetRules[(j+1)]);

            var k = j + 2;
            var axeStyles = {};

            while (typeof stylesheetRules[k] === 'string') {
                var property = stylesheetRules[k].substring(0,stylesheetRules[k].indexOf(':'));
                var value = stylesheetRules[k].substring((stylesheetRules[k].indexOf(':') + 1));
                axeStyles[property] = value;
                k++;
            }

            axeRule['axeStyles'] = axeStyles;
            axeRule['blades'] = [];
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


function siblingImmediatePrevious(element) {
    var immediatePreviousSibling = [];

    for (var i = 0; i < element.parentNode.children.length; i++) {
        if (element.parentNode.children[i] !== element.previousElementSibling) continue;
        if (element.parentNode.children[i] === element) break;
        immediatePreviousSibling[0] = element.parentNode.children[i];
    }

    return immediatePreviousSibling;
}


function siblingImmediate(element) {
    var immediateSiblings = [];

    for (var i = 0; i < element.parentNode.children.length; i++) {

        if (element.parentNode.children[i] === element.previousElementSibling) {
            immediateSiblings.push(element.parentNode.children[i]);
        }

        if (element.parentNode.children[i] === element.nextElementSibling) {
            immediateSiblings.push(element.parentNode.children[i]); break;
        }
    }

    return immediateSiblings;
}


function ancestorImmediate(element) {
    var immediateAncestor = [];
    immediateAncestor[0] = element.parentNode;
    return immediateAncestor;
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
        case ('<') : targetElements = ancestorImmediate(node); break;
        case ('^') : targetElements = ancestorAll(node); break;
        case ('%') : targetElements = siblingImmediate(node); break;
        case ('|') : targetElements = siblingAll(node); break;
        case ('?') : targetElements = siblingImmediatePrevious(node); break;
        case ('!') : targetElements = siblingAllPrevious(node); break;
    }

    return targetElements;
}


function axeStyle(axeRule) {

    var segment = 0;
    var selectorFragment = axeRule.axeSelector[1];

    while (axeRule.axeSelector.length > (segment + 2)) {

        var newSegment = (segment + 2);
        var symbol = axeRule.axeSelector[newSegment].substring(1,2);
        var pattern = selectorFragment.replace(/([^\]]+\])([^\:]+)(\:[^\s]+)(.*)/,'$1$2$4');

        if (pattern.match(/\[/)) {
            pattern = pattern.replace(/\:/g, '&');
        }

        else {
            pattern = pattern.replace(/([^\:]+)(\:[^\s]+)(.*)/, '$1$3');
        }

        var nodes = document.querySelectorAll(pattern);

        var currentAttribute = '';
        for (var a = 1; a < newSegment; a++) {currentAttribute += axeRule.axeSelector[a];}
        var nextAttribute = '';
        for (var a = 1; a < (newSegment + 1); a++) {nextAttribute += axeRule.axeSelector[a];}

        for (var j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            if (axeRule.axeSelector[(segment + 1)].match(/[\:]/)) {
                node.setAttribute('data-axe-' + axeRule.axeIndex + ('0' + segment).slice(-2), currentAttribute.replace(':','&'));
            }

            var needle = axeRule.axeSelector[newSegment].substring(3).replace(/\:[^\s]+/g, '');

            var targetElements = activateSymbol(symbol, node);
            targetElements.forEach(function(targetElement){
                if (targetElement[nodeProperties(needle).label] === nodeProperties(needle).name) {
                    targetElement.setAttribute('data-axe-' + axeRule.axeIndex + ('0' + (segment + 1)).slice(-2), nextAttribute.replace(':','&'));
                }
            });
        }

        selectorFragment = '[data-axe-' + axeRule.axeIndex + ('0' + (segment + 1)).slice(-2) + ' ="' + nextAttribute + '"]';
        selectorFragment += (axeRule.axeSelector[(newSegment + 1)] ? axeRule.axeSelector[(newSegment + 1)] : '');
        segment = newSegment;
    }

    for (var a = (axeRule.axeIndex * 100); a < ((axeRule.axeIndex * 100) + (segment - 1)); a++) {
        var elements = document.querySelectorAll('[data-axe-' + a + ']');
        elements.forEach(function(element){
            element.removeAttribute('data-axe-' + a);
        });
    }

    document.styleSheets[0].insertRule(selectorFragment + '{' + styleString(axeRule.axeStyles) + '}', axeRule.axeIndex);

    if (axeRule.axeSelector[0].match(/\:click|\:hover/)) {
        var pseudoElement = axeRule.axeSelector[0].replace(/[^\:]+(\:[^\s]+).*/,'$1');

        switch (pseudoElement) {
            case(':click') : pseudoClick(axeRule); break;
            case(':hover') : pseudoHover(axeRule); break;
        }
    }
}


axe.axeRules.forEach(function(axeRule){axeStyle(axeRule);});




function pseudoHover(axeRule) {

    if (axeRule.axeSelector.length % 2 > 0) {
        var dataAttribute = 'axe-' + ((axeRule.axeIndex * 100) + (axeRule.axeSelector.length - 2));
        var axeRuleQuery = '[data-' + dataAttribute + '="' + axeRule.axeSelector[0].replace(/\:/g,'&') + '"]';
    }

    else {
        var fragment = axeRule.axeSelector[1].replace(/\:/g,'&');

        for (var s = 2; s < (axeRule.axeSelector.length - 1); s++) {
            fragment += axeRule.axeSelector[s].replace(/\:/g,'&');
        }

        var dataAttribute = 'axe-' + ((axeRule.axeIndex * 100) + (axeRule.axeSelector.length - 2) - 1);
        var axeRuleQuery = '[data-' + dataAttribute + '="' + fragment + '"]' + axeRule.axeSelector[(axeRule.axeSelector.length - 1)];
    }

    var axeTargets = document.querySelectorAll(axeRuleQuery);
    
    var activeFragment = axeRule.axeSelector[0];

    activeFragment = activeFragment.replace(/\&/g,'@&');
    activeFragment = activeFragment.replace(/\</g,'@<');
    activeFragment = activeFragment.replace(/\^/g,'@^');
    activeFragment = activeFragment.replace(/\?/g,'@?');
    activeFragment = activeFragment.replace(/\!/g,'@!');
    activeFragment = activeFragment.replace(/\%/g,'@%');
    activeFragment = activeFragment.replace(/\|/g,'@|');

    activeFragment = activeFragment.replace(/\+/g,'?');
    activeFragment = activeFragment.replace(/\>/g,'<');
    activeFragment = activeFragment.replace(/\~/g,'!');

    activeFragment = activeFragment.replace(/\@\&/g,':');
    activeFragment = activeFragment.replace(/\@\</g,'>');
    activeFragment = activeFragment.replace(/\@\^/g,'');
    activeFragment = activeFragment.replace(/\@\?/g,'+');
    activeFragment = activeFragment.replace(/\@\!/g,'~');
    activeFragment = activeFragment.replace(/\@\%/g,'@');
    activeFragment = activeFragment.replace(/\@\|/g,'@');

    activeFragment = activeFragment.split(' ');
    activeFragment = activeFragment.reverse();
    activeFragment.shift();
    activeFragment = ' ' + activeFragment.join(' ');
    activeFragment = activeFragment.replace(/\:hover.*/,'');

    activeFragment = separateQuery('activeFragment' + activeFragment);
    activeFragment.shift();

    axeTargets.forEach(function(axeTarget, i){
        axeRule.blades[axeRule.blades.length] = {};
        axeTarget.setAttribute('data-axetarget', axeRule.axeIndex + '-' + i);
        
        var newBlade = activeFragment;
        if (i > 0) {newBlade.shift();}
        newBlade.unshift('[data-axetarget="' + axeRule.axeIndex + '-' + i + '"]');
        forgeSelector(newBlade);
        axeRule.blades[(axeRule.blades.length - 1)]['bladeSelector'] = forgedSelector.split(';');
        var bladeSelector = axeRule.blades[(axeRule.blades.length - 1)].bladeSelector;
        bladeSelector.unshift(newBlade.join(' '));


        function activateBlade(bladeSelector) {

            var bladeSegment = 0;
            var bladeSelectorFragment = bladeSelector[1];

            while (bladeSelector.length > (bladeSegment + 2)) {

                var bladeNewSegment = (bladeSegment + 2);
                var bladeSymbol = bladeSelector[bladeNewSegment].substring(1,2);
                var bladePattern = bladeSelectorFragment.replace(/([^\]]+\])([^\:]+)(\:[^\s]+)(.*)/,'$1$2$4');

                var bladeNodes = document.querySelectorAll(bladePattern);

                var bladeCurrentAttribute = '';
                for (var a = 1; a < bladeNewSegment; a++) {bladeCurrentAttribute += bladeSelector[a];}
                var bladeNextAttribute = '';
                for (var a = 1; a < (bladeNewSegment + 1); a++) {bladeNextAttribute += bladeSelector[a];}

                for (var j = 0; j < bladeNodes.length; j++) {
                    var bladeNode = bladeNodes[j];

                    var bladeNeedle = bladeSelector[bladeNewSegment].substring(3).replace(/\:[^\s]+/g, '');

                    var bladeTargetElements = activateSymbol(bladeSymbol, bladeNode);
                    bladeTargetElements.forEach(function(bladeTargetElement){
                        if (bladeTargetElement[nodeProperties(bladeNeedle).label] === nodeProperties(bladeNeedle).name) {
                            bladeTargetElement.setAttribute('data-bladesegment-' + axeRule.axeIndex + '-' + i + '-' + ('0' + (bladeSegment + 1)).slice(-2), bladeNextAttribute);
                        }
                    });
                }

                bladeSelectorFragment = '[data-bladesegment-' + axeRule.axeIndex + '-' + i + '-' + ('0' + (bladeSegment + 1)).slice(-2) + ' ="' + bladeNextAttribute + '"]';
                bladeSelectorFragment += (bladeSelector[(bladeNewSegment + 1)] ? bladeSelector[(bladeNewSegment + 1)] : '');
                bladeSegment = bladeNewSegment;
            }

            console.log(bladeSelectorFragment);
            /* document.styleSheets[0].insertRule(selectorFragment + '{' + styleString(axeRule.axeStyles) + '}', axeRule.axeIndex); */
        }

        activateBlade(bladeSelector);
















        /*
        axeBlades.forEach(function(axeBlade){
            axeBlade.setAttribute('data-axeblade', ((axeRule.axeIndex * 100) + i));
            var currentTarget = document.querySelector('[data-axetarget="' + ((axeRule.axeIndex * 100) +  i) + '"]');
            axeBlade.addEventListener('mouseover', function(){currentTarget.dataset[dataAttribute] = currentTarget.dataset[dataAttribute].replace('&',':');}, false);
            axeBlade.addEventListener('mouseout', function(){currentTarget.dataset[dataAttribute] = currentTarget.dataset[dataAttribute].replace(':','&');}, false);
            axeBlade.removeAttribute('data-axeblade');
        });

        */

        /* axeTarget.removeAttribute('data-axetarget'); */
    });
}


for (var i = 0; i < document.styleSheets[0].cssRules.length; i++) {
console.log(document.styleSheets[0].cssRules[i]);
}
