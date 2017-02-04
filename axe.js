var stylePaths = [];
var linkedStyleSheets = document.querySelectorAll('[rel="stylesheet"]');

linkedStyleSheets.forEach(function(linkedStyleSheet){
   var path = linkedStyleSheet.getAttribute('href');
   stylePaths[stylePaths.length] = path;
});

var headStyles = document.createElement('style');
document.head.appendChild(headStyles);

var symbols = ['<','^','%','|','?','!'];

function getAxeStyles() {
    for (var i = (stylePaths.length - 1); i > -1 ; i--) {
        var axeStyleSheet = new XMLHttpRequest();
        axeStyleSheet.onreadystatechange = function() {
            if ((this.readyState === 4) && (this.status === 200)) {
                headStyles.textContent = this.responseText + headStyles.textContent;
            }
        };
  
        axeStyleSheet.open('GET', stylePaths[i], true);
        axeStyleSheet.send();
    }

    axeStyleSheet.addEventListener('load', function(){initialiseStylesheets();}, false);
}

getAxeStyles();


function separateQuery(query) {
    query = query.replace(/(\w)\s+([\w\.\#])/g,'$1; ;$2');
    query = query.replace(/(\w)\s*?([\>\+\~\<\^\?\!\%\|\*])\s*?([\w\.\#])/g,'$1;$2;$3');
    query = query.split(';');
    return query;
}


function reverseSymbol(query) {
    for (var q = 0; q < query.length; q++) {
        query[q] = query[q].replace(/\>/,'<');
        query[q] = query[q].replace(/\s/,'^');
        query[q] = query[q].replace(/\+/,'?');
        query[q] = query[q].replace(/\~/,'!');
    }
}

function convertQuery(query) {

    for (var b = 0; b < query.length; b++) {
        if (query[b].match(/\:/)) {
           var axis = b;
        }
    }
 
    var bladeArray = new Array(query[axis]);
    var a = (axis - 1);
    var c = (axis + 1);

    while ((a > -1) && (symbols.indexOf(query[a]) < 0)) {
        bladeArray.unshift(query[a]);
        a--;
    }

    while ((c < query.length) && (symbols.indexOf(query[c]) < 0)) {
        bladeArray.push(query[c]);
        c++;
    }

    bladeArray.shift();

    for (var b = 0; b < bladeArray.length; b++) {
        if (bladeArray[b].match(/\:/)) {
           var bladeStart = b;
        }
    }

    var bladeCoverArray = bladeArray.slice();
    var bladeEdgeArray = bladeArray.slice(bladeStart);
    var newBladeArray = bladeEdgeArray.slice();

    bladeCoverArray[bladeStart] = bladeCoverArray[bladeStart].replace(':hover','');

    newBladeArray.pop();
    newBladeArray.reverse();
    reverseSymbol(newBladeArray);

    for (var bladeCover = (bladeCoverArray.length - 1); bladeCover > -1; bladeCover--) {
        newBladeArray.unshift(bladeCoverArray[bladeCover]);
    }


    for (var bladeEdge = 1; bladeEdge < bladeEdgeArray.length; bladeEdge++) {
        newBladeArray.push(bladeEdgeArray[bladeEdge]);
    }

    var startOfQuery = query.slice(0, (axis - bladeStart));
    var endOfQuery = query.slice((startOfQuery.length + bladeArray.length));
    var query = startOfQuery.concat(newBladeArray).concat(endOfQuery);

    return query;
}


function forgeSelector(query) {

    var queryString = query.join(' ');

    if (queryString.match(/\:hover\s[\s|\+|\>|\~]+/)) {
        query = convertQuery(query);
    }

    var forgedSelector = '';

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
    }

    return forgedSelector;
}


function initialiseStylesheets() {

    // CONVERT STYLESHEET INTO ARRAY

    var stylesheets = document.getElementsByTagName('style');

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

                        var k = (j + 1);
                        var ruleSet = [];
                        var ruleDeclaration = [];

                        while ((stylesheet[k].match(/\:/)) && (!stylesheet[k].match(/\:hover/))) {
                            ruleSet.push(stylesheet[k]);
                            k++;
                        }

                        for (var r = 0; r < ruleCount; r++) {
                            ruleDeclaration.push(ruleGroup[r]);
                            for (var s = 0; s < ruleSet.length; s++) {
                                ruleDeclaration.push(ruleSet[s]);
                            }
                        }

                        stylesheet.splice(j, (ruleSet.length + 1), ...ruleDeclaration);

                        for (var r = 0; r < ruleCount; r++) {
                            if (ruleGroup[r].match(/\?/) === null) {
                                var rulePosition = ((ruleIndex - 1) > document.styleSheets[0].cssRules.length ? document.styleSheets[0].cssRules.length : (ruleIndex - 1));
                            
                                var ruleSeries = '';
                                for (var rs = 0; rs < ruleSet.length; rs++) {
                                    ruleSeries += stylesheet[(j + rs + 1)] + ';';
                                }

                                document.styleSheets[0].insertRule(ruleGroup[r] + '{' + ruleSeries + '}', rulePosition);
                            }
                        }
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

        for (var j = 0; j < stylesheetRules.length; j++) {

            if ((typeof stylesheetRules[j] === 'number') && (stylesheetRules[(j+1)].match(/(\<|\^|\?|\!|\%|\|)/))) {

                axe.axeRules[axeRuleIndex] = {};
                var axeRule = axe.axeRules[axeRuleIndex];
                axeRule['axeIndex'] = stylesheetRules[j];
                var bronze = separateQuery(stylesheetRules[(j+1)]);
                var forgedSelector = forgeSelector(bronze);
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
                axeRuleIndex++;
            }
        }
    }

    axe.axeRules.forEach(function(axeRule){axeStyle(axeRule);});
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
            targetElements.forEach(function(targetElement, t){
                if (targetElement[nodeProperties(needle).label] === nodeProperties(needle).name) {
                    targetElement.setAttribute('data-axe-' + axeRule.axeIndex + ('0' + (segment + 1)).slice(-2), nextAttribute.replace(':','&'));
                }
            });
        }

        selectorFragment = '[data-axe-' + axeRule.axeIndex + ('0' + (segment + 1)).slice(-2) + '="' + nextAttribute + '"]';
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



function activateQuery(querySelector,segmentName) {

    var querySegment = 0;
    var querySelectorFragment = querySelector[1];

    while (querySelector.length > (querySegment + 2)) {

        var queryNewSegment = (querySegment + 2);
        var querySymbol = querySelector[queryNewSegment].substring(1,2);
        var queryPattern = querySelectorFragment.replace(/([^\]]+\])([^\:]+)(\:[^\s]+)(.*)/,'$1$2$4');

        var queryNodes = document.querySelectorAll(queryPattern);

        var queryCurrentAttribute = '';
        for (var a = 1; a < queryNewSegment; a++) {queryCurrentAttribute += querySelector[a];}
        var queryNextAttribute = '';
        for (var a = 1; a < (queryNewSegment + 1); a++) {queryNextAttribute += querySelector[a];}

        for (var j = 0; j < queryNodes.length; j++) {
            var queryNode = queryNodes[j];

            var queryNeedle = querySelector[queryNewSegment].substring(3).replace(/\:[^\s]+/g, '');

            var queryTargetElements = activateSymbol(querySymbol, queryNode);

            queryTargetElements.forEach(function(queryTargetElement){
                if (queryTargetElement[nodeProperties(queryNeedle).label] === nodeProperties(queryNeedle).name) {
                        queryTargetElement.setAttribute('data-' + segmentName + '-segment-' + (querySegment + 1),'');
                }
            });
        }

        querySelectorFragment = '[data-' + segmentName + '-segment-' + (querySegment + 1) + ']';
        querySelectorFragment += (querySelector[(queryNewSegment + 1)] ? querySelector[(queryNewSegment + 1)] : '');
        querySegment = queryNewSegment;
    }

    if (querySelector.length <= (querySegment + 2)) {

        if ((segmentName.substr(-7,7) === '-target') && (querySelector.length % 2 === 0)) {
            querySelectorFragment = querySelectorFragment.replace(/([^\]]+\]).*/, '$1');
        }

        return querySelectorFragment;  
    }
}


function pseudoHover(axeRule) {

    if (axeRule.axeSelector.length % 2 > 0) {
        var dataAttribute = 'axe-' + ((axeRule.axeIndex * 100) + (axeRule.axeSelector.length - 2));
    }

    else {
        var fragment = axeRule.axeSelector[1].replace(/\:/g,'&');

        for (var s = 2; s < (axeRule.axeSelector.length - 1); s++) {
            fragment += axeRule.axeSelector[s].replace(/\:/g,'&');
        }

        var dataAttribute = 'axe-' + ((axeRule.axeIndex * 100) + (axeRule.axeSelector.length - 2) - 1);
    }
    
    axeRule.bladeSelector = [];
    axeRule.targetSelector = [];
    var bladeSelector = axeRule.bladeSelector;
    var targetSelector = axeRule.targetSelector;
    var bladeCompleted = false;
    
    for (var b = 1; b < axeRule.axeSelector.length; b++) {
        if (bladeCompleted !== true) {
            bladeSelector.push(axeRule.axeSelector[b]);

            if (axeRule.axeSelector[b].match(/\:/)) {
                bladeSelector[(bladeSelector.length - 1)] = bladeSelector[(bladeSelector.length - 1)].replace(/([^\:]+):hover(.*)/, '$1$2');
                bladeCompleted = true;
            }
        }

        else if (bladeCompleted === true) {
            targetSelector.push(axeRule.axeSelector[b]);
        }
    }

    bladeSelector.unshift(bladeSelector.join(''));
    var bladeSelectorFragment = activateQuery(bladeSelector,'axe-' + axeRule.axeIndex + '-blade');
    var axeBlades = document.querySelectorAll(bladeSelectorFragment);

    axeBlades.forEach(function(axeBlade, bladeIndex){

        var bladeIndex = bladeIndex;

        axeBlade.setAttribute('data-axe-' + axeRule.axeIndex + '-blade-' + bladeIndex, bladeSelector[0]);

        if (bladeIndex > 0) {
            targetSelector.shift();
            targetSelector[0] = targetSelector[0].replace(/([^\]]+\])(.*)/, '$2');

            if (targetSelector[0].match(/^\s*$/)) {
                targetSelector.shift();
            }
        }
        
        if (targetSelector.length > 0) {
            if (targetSelector[0].match(/\?|\!|\^|\||\<|\%/)) {
                targetSelector.unshift('[data-axe-' + axeRule.axeIndex + '-blade-' + bladeIndex + ']');
            }

            else {
                targetSelector[0] = '[data-axe-' + axeRule.axeIndex + '-blade-' + bladeIndex + ']' + targetSelector[0];
            }
        }

        else {
            targetSelector[0] = '[data-axe-' + axeRule.axeIndex + '-blade-' + bladeIndex + ']';
        }

        targetSelector.unshift(targetSelector.join(''));

        var targetSelectorFragment = activateQuery(targetSelector, 'axe-' + axeRule.axeIndex + '-target');

        var axeTargets = document.querySelectorAll(targetSelectorFragment);

        axeTargets.forEach(function(axeTarget){
            axeTarget.setAttribute('data-axe-' + axeRule.axeIndex + '-target-' + bladeIndex, targetSelector[0]);
        });

        
        for (var t = 0; t < targetSelector.length; t++) {
            var axeTargetSegments = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-target-segment-' + t + ']');
            for (var s = 0; s < axeTargetSegments.length; s++) {
                axeTargetSegments[s].removeAttribute('data-axe-' + axeRule.axeIndex + '-target-segment-' + t + '');
            }
        }

        var bladeTargets = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-target-' + bladeIndex + ']');
        
        axeBlade.addEventListener('mouseover', function(){
            bladeTargets.forEach(function(bladeTarget){
                bladeTarget.dataset[dataAttribute] = bladeTarget.dataset[dataAttribute].replace('&',':');
            });
        }, false);

        axeBlade.addEventListener('mouseout', function(){
            bladeTargets.forEach(function(bladeTarget){
                bladeTarget.dataset[dataAttribute] = bladeTarget.dataset[dataAttribute].replace(':','&');
            });
        }, false);

    });

    for (var b = 0; b < bladeSelector.length; b++) {
        var axeBladeSegments = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-blade-segment-' + b + ']');
        for (var s = 0; s < axeBladeSegments.length; s++) {
            axeBladeSegments[s].removeAttribute('data-axe-' + axeRule.axeIndex + '-blade-segment-' + b + '');
        }
    }


    for (var as = 0; as < (axeRule.axeSelector.length * 2); as++) {
        var axeBlades = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-blade-' + as + ']');
        var axeTargets = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-target-' + as + ']');

        for (var ab = 0; ab < axeBlades.length; ab++) {
            axeBlades[ab].removeAttribute('data-axe-' + axeRule.axeIndex + '-blade-' + as);
        }
        
        for (var at = 0; at < axeTargets.length; at++) {
            axeTargets[at].removeAttribute('data-axe-' + axeRule.axeIndex + '-target-' + as);
        }
    }
}


for (var i = 0; i < document.styleSheets[0].cssRules.length; i++) {
console.log(document.styleSheets[0].cssRules[i]);
}
