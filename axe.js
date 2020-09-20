/*
axe INSPIRED BY...
==================
1) Learning jQuery fundamentals in a few days and being massively impressed by the elegance and simplicity of its syntax 
2) Questions on StackOverflow showing where plain CSS falls short
3) Wanting to learn to use Javascript objects competently
4) Lea Verou's MarkApp
5) "You might not need Javascript"
6) Element Queries
*/

/*
NOTA BENE (BEFORE GETTING CARRIED AWAY WITH AXE)
================================================
"CSS should not depend on the markup; the markup should depend on the CSS." - Keith J. Grant
(Source: https://keithjgrant.com/posts/2015/05/against-css-in-js/)

We need to recognise that CSS compound selectors describing relationships between elements in the HTML document
lead, by definition, to tighter coupling. Needless to say, this *isn't* a good thing.

As a rule of thumb something like BEM-style classnames are always going to be better than compound selectors describing
inter-element relationships.
*/

// THERE NEEDS TO BE AN :nth-of-set() AT SOME POINT which handles element classes as well as types 
// nth-of-set can also take context. eg. img:nth-of-set(even, 'main aside')
// will select every even img from this: <main> [...] <aside><p><img></p> <p></p> <p><img></p></aside> [...] </main> etc.

// console.time('axeSpeed');


const siblingImmediatePrevious = (element) => {
    let immediatePreviousSibling = [];

    for (let i = 0; i < element.parentNode.children.length; i++) {
        if (element.parentNode.children[i] !== element.previousElementSibling) continue;
        if (element.parentNode.children[i] === element) break;
        immediatePreviousSibling[0] = element.parentNode.children[i];
    }

    return immediatePreviousSibling;
}


const siblingImmediate = (element) => {
    let immediateSiblings = [];

    for (let i = 0; i < element.parentNode.children.length; i++) {

        if (element.parentNode.children[i] === element.previousElementSibling) {
            immediateSiblings.push(element.parentNode.children[i]);
        }

        if (element.parentNode.children[i] === element.nextElementSibling) {
            immediateSiblings.push(element.parentNode.children[i]); break;
        }
    }

    return immediateSiblings;
}


const ancestorImmediate = (element) => {
    let immediateAncestor = [];
    immediateAncestor[0] = element.parentNode;
    return immediateAncestor;
}


const ancestorAll = (element) => {
    let allAncestors = [];
    let ancestor = element.parentNode;

    while (ancestor.nodeName !== 'HTML') {
        allAncestors[(allAncestors.length)] = ancestor;
        ancestor = ancestor.parentNode;
    }

    return allAncestors;
}


const siblingAllPrevious = (element) => {
    let s = 0;
    let allPreviousSiblings = [];

    for (let i = 0; i < element.parentNode.children.length; i++) {
        if (element.parentNode.children[i] === element) break;
        allPreviousSiblings[s] = element.parentNode.children[i];
        s++;
    }

    return allPreviousSiblings;
}


const siblingAll = (element) => {
    let s = 0;
    let allSiblings = [];

    for (let i = 0; i < element.parentNode.children.length; i++) {
        if (element.parentNode.children[i] === element) continue;
        allSiblings[s] = element.parentNode.children[i];
        s++;
    }

    return allSiblings;
}



const activateSymbol = (symbol, node) => {
    let targetElements = [];

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



const activateQuery = (querySelector,segmentName) => {

    let querySegment = 0;
    let querySelectorFragment = querySelector[1];

    while (querySelector.length > (querySegment + 2)) {

        let queryNewSegment = (querySegment + 2);
        let querySymbol = querySelector[queryNewSegment].substring(1,2);
        let queryPattern = querySelectorFragment.replace(/([^\]]+\])([^\:]+)(\:[^\s]+)(.*)/,'$1$2$4');

        let queryNodes = document.querySelectorAll(queryPattern);

        let queryCurrentAttribute = '';
        for (let a = 1; a < queryNewSegment; a++) {queryCurrentAttribute += querySelector[a];}
        let queryNextAttribute = '';
        for (let a = 1; a < (queryNewSegment + 1); a++) {queryNextAttribute += querySelector[a];}

        for (let j = 0; j < queryNodes.length; j++) {
            let queryNode = queryNodes[j];

            let queryNeedle = querySelector[queryNewSegment].substring(3).replace(/\:[^\s]+/g, '');

            let queryTargetElements = activateSymbol(querySymbol, queryNode);

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



const pseudoHover = (axeRule) => {

    let dataAttribute;

    if (axeRule.axeSelector.length % 2 > 0) {
        dataAttribute = 'axe-' + ((axeRule.axeIndex * 100) + (axeRule.axeSelector.length - 2));
    }

    else {
        let fragment = axeRule.axeSelector[1].replace(/\:/g,'&');

        for (let s = 2; s < (axeRule.axeSelector.length - 1); s++) {
            fragment += axeRule.axeSelector[s].replace(/\:/g,'&');
        }

        dataAttribute = 'axe-' + ((axeRule.axeIndex * 100) + (axeRule.axeSelector.length - 2) - 1);
    }
    
    axeRule.bladeSelector = [];
    axeRule.targetSelector = [];
    let bladeSelector = axeRule.bladeSelector;
    let targetSelector = axeRule.targetSelector;
    let bladeCompleted = false;
    
    for (let b = 1; b < axeRule.axeSelector.length; b++) {
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
    let bladeSelectorFragment = activateQuery(bladeSelector,'axe-' + axeRule.axeIndex + '-blade');
    let axeBlades = document.querySelectorAll(bladeSelectorFragment);

    axeBlades.forEach(function(axeBlade, bladeIndex){

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

        let targetSelectorFragment = activateQuery(targetSelector, 'axe-' + axeRule.axeIndex + '-target');

        let axeTargets = document.querySelectorAll(targetSelectorFragment);

        axeTargets.forEach(function(axeTarget){
            axeTarget.setAttribute('data-axe-' + axeRule.axeIndex + '-target-' + bladeIndex, targetSelector[0]);
        });

        
        for (let t = 0; t < targetSelector.length; t++) {
            let axeTargetSegments = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-target-segment-' + t + ']');
            for (let s = 0; s < axeTargetSegments.length; s++) {
                axeTargetSegments[s].removeAttribute('data-axe-' + axeRule.axeIndex + '-target-segment-' + t + '');
            }
        }

        let bladeTargets = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-target-' + bladeIndex + ']');
        
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

    for (let b = 0; b < bladeSelector.length; b++) {
        let axeBladeSegments = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-blade-segment-' + b + ']');
        for (let s = 0; s < axeBladeSegments.length; s++) {
            axeBladeSegments[s].removeAttribute('data-axe-' + axeRule.axeIndex + '-blade-segment-' + b + '');
        }
    }


    for (let as = 0; as < (axeRule.axeSelector.length * 2); as++) {
        let axeBlades = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-blade-' + as + ']');
        let axeTargets = document.querySelectorAll('[data-axe-' + axeRule.axeIndex + '-target-' + as + ']');

        for (let ab = 0; ab < axeBlades.length; ab++) {
            axeBlades[ab].removeAttribute('data-axe-' + axeRule.axeIndex + '-blade-' + as);
        }
        
        for (let at = 0; at < axeTargets.length; at++) {
            axeTargets[at].removeAttribute('data-axe-' + axeRule.axeIndex + '-target-' + as);
        }
    }
}




const styleString = (styleObject) => {
    let styleString = '';

    Object.keys(styleObject).forEach(function(property){
        styleString += property + ':' + styleObject[property] + '; ';
    });
    
    return styleString;
}


const nodeProperties = (node) => {
    let nodeProperties = {};
    
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

    if (node.indexOf('.') > 0) {
        nodeProperties['qualifierClass'] = node.substr(node.indexOf('.') + 1);   
    }

    return nodeProperties;
}


const forgeSelector = (query) => {

    let queryString = query.join(' ');

    if (queryString.match(/\:hover\s[\s\+\>\~]+/)) {
        query = convertQuery(query);
    }

    let forgedSelector = '';

    for (let a = 0; a < query.length; a++) {

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


const initialiseStylesheets = () => {

    // CONVERT STYLESHEET INTO ARRAY

    let stylesheets = document.getElementsByTagName('axe-styles');

    for (let i = 0; i < stylesheets.length; i++) {

        let stylesheetText = stylesheets[i].textContent;
        stylesheetText = stylesheetText.replace(/\\/g,' ^ body ');
        stylesheetText = stylesheetText.replace(/\n/g,' ');
        stylesheetText = stylesheetText.replace(/\/\*.*?\*\//g,'');
        stylesheetText = stylesheetText.replace(/\@keyframes.*?\{.*?\}\s*\}/g,'');
        stylesheetText = stylesheetText.replace(/[\s]*{/g,'{');
        stylesheetText = stylesheetText.replace(/\;?[\s]*}/g,'}');
        stylesheetText = stylesheetText.replace(/{[\s]*/g,'{');
        stylesheetText = stylesheetText.replace(/}[\s]*/g,'}');

        let stylesheet = stylesheetText.split(/{|}|;/);
        let stylesheetRules = [];
        let ruleIndex = 0;

        for (let j = 0; j < stylesheet.length; j++) {

            if (!stylesheet[j].match(/(^$|^\s+$)/)) {

                if (!stylesheet[j].match(/\:/) ||
                     stylesheet[j].match(/\:\:|\:nth|\:first|\:last|\:link|\:visited|\:hover|\:active|\:focus|\:target/)) {

                    stylesheetRules[stylesheetRules.length] = ruleIndex;

                    ruleIndex++;

                    // SEPARATE OUT COMMA-SEPARATED RULE-GROUPS
                
                    if (stylesheet[j].match(/\,/g)) {
                        let ruleCount = (stylesheet[j].match(/\,/g).length + 1);
                        let ruleGroup = stylesheet[j].split(',');

                        let k = (j + 1);
                        let ruleSet = [];
                        let ruleDeclaration = [];

                        while ((stylesheet[k].match(/\:/)) && (!stylesheet[k].match(/\:hover/))) {
                            ruleSet.push(stylesheet[k]);
                            k++;
                        }

                        for (let r = 0; r < ruleCount; r++) {
                            ruleDeclaration.push(ruleGroup[r]);
                            for (let s = 0; s < ruleSet.length; s++) {
                                ruleDeclaration.push(ruleSet[s]);
                            }
                        }

                        stylesheet.splice(j, (ruleSet.length + 1), ...ruleDeclaration);

                        for (let r = 0; r < ruleCount; r++) {
                            if (ruleGroup[r].match(/[\<\^\?\!\%\|]/) === null) {
                                let rulePosition = ((ruleIndex - 1) > document.styleSheets[0].cssRules.length ? document.styleSheets[0].cssRules.length : (ruleIndex - 1));
                            
                                let ruleSeries = '';
                                for (let rs = 0; rs < ruleSet.length; rs++) {
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

        // BUILD AXE RULES OBJECT

        let axe = {};
        axe['axeRules'] = [];
        let axeRuleIndex = 0;

        for (let j = 0; j < stylesheetRules.length; j++) {

            if ((typeof stylesheetRules[j] === 'number') && (stylesheetRules[(j+1)].match(/(\<|\^|\?|\!|\%|\|)/))) {

                axe.axeRules[axeRuleIndex] = {};
                let axeRule = axe.axeRules[axeRuleIndex];
                axeRule['axeIndex'] = stylesheetRules[j];
                let bronze = separateQuery(stylesheetRules[(j+1)]);
                let forgedSelector = forgeSelector(bronze);
                axeRule['axeSelector'] = forgedSelector.split(';');
                axeRule.axeSelector.unshift(stylesheetRules[(j+1)]);

                let k = j + 2;
                let axeStyles = {};

                while (typeof stylesheetRules[k] === 'string') {
                    let property = stylesheetRules[k].substring(0,stylesheetRules[k].indexOf(':'));
                    let value = stylesheetRules[k].substring((stylesheetRules[k].indexOf(':') + 1));
                    axeStyles[property] = value;
                    k++;
                }

                axeRule['axeStyles'] = axeStyles;
                axeRuleIndex++;
            }
        }
    }

    axe.axeRules.forEach(function(axeRule){axeStyle(axeRule);});

    // console.timeEnd('axeSpeed');
    // console.log(stylesheetRules);
    // console.log(axe);

    // for (let i = 0; i < document.styleSheets[0].cssRules.length; i++) {
    //    console.log(document.styleSheets[0].cssRules[i]);
    //}

    document.head.removeChild(axeStylesElement);
}


const getAxeStyles = () => {
    let axeStyleSheet;

    for (let i = (styleSheetPaths.length - 1); i > -1 ; i--) {
        axeStyleSheet = new XMLHttpRequest();
        axeStyleSheet.onreadystatechange = function() {
            if ((this.readyState === 4) && (this.status === 200)) {
                axeStylesElement.textContent = this.responseText + axeStylesElement.textContent;
            }
        };
  
        axeStyleSheet.open('GET', styleSheetPaths[i], true);
        axeStyleSheet.send();
    }

    if (typeof axeStyleSheet != 'undefined') {
        axeStyleSheet.addEventListener('load', function(){initialiseStylesheets();}, false);
    }

    else {
        axeStylesElement.textContent = document.head.getElementsByTagName('style')[0].textContent;
        initialiseStylesheets();
    }
}


const separateQuery = (query) => {
    query = query.replace(/(\w)\s+([\w\.\#])/g,'$1; ;$2');
    query = query.replace(/(\w)\s*?([\>\+\~\<\^\?\!\%\|\*])\s*?([\w\.\#])/g,'$1;$2;$3');
    query = query.split(';');
    return query;
}


const axeStyle = (axeRule) => {

    let segment = 0;
    let selectorFragment = axeRule.axeSelector[1];

    while (axeRule.axeSelector.length > (segment + 2)) {

        let newSegment = (segment + 2);
        let symbol = axeRule.axeSelector[newSegment].substring(1,2);
        let pattern = selectorFragment.replace(/([^\]]+\])([^\:]+)(\:[^\s]+)(.*)/,'$1$2$4');

        if (pattern.match(/\[/)) {
            pattern = pattern.replace(/\:/g, '&');
        }

        else {
            pattern = pattern.replace(/([^\:]+)(\:[^\s]+)(.*)/, '$1$3');
        }

        let nodes = document.querySelectorAll(pattern);

        let currentAttribute = '';
        for (let a = 1; a < newSegment; a++) {currentAttribute += axeRule.axeSelector[a];}
        let nextAttribute = '';
        for (let a = 1; a < (newSegment + 1); a++) {nextAttribute += axeRule.axeSelector[a];}

        for (let j = 0; j < nodes.length; j++) {
            let node = nodes[j];
            if (axeRule.axeSelector[(segment + 1)].match(/[\:]/)) {
                node.setAttribute('data-axe-' + axeRule.axeIndex + ('0' + segment).slice(-2), currentAttribute.replace(':','&'));
            }

            let needle = axeRule.axeSelector[newSegment].substring(3).replace(/\:[^\s]+/g, '');

            let targetElements = activateSymbol(symbol, node);
            targetElements.forEach(function(targetElement, t) {

                let completeLabel = targetElement[nodeProperties(needle).label];

                if (nodeProperties(needle).hasOwnProperty('qualifierClass')) {
                    if (targetElement.classList.contains(nodeProperties(needle).qualifierClass)) {
                        completeLabel += '.' + nodeProperties(needle).qualifierClass.toUpperCase();
                    }
                }

                if (completeLabel === nodeProperties(needle).name) {
                    targetElement.setAttribute('data-axe-' + axeRule.axeIndex + ('0' + (segment + 1)).slice(-2), nextAttribute.replace(':','&'));
                    // console.log('data-axe-' + axeRule.axeIndex + ('0' + (segment + 1)).slice(-2));
                }
            });
        }

        selectorFragment = '[data-axe-' + axeRule.axeIndex + ('0' + (segment + 1)).slice(-2) + '="' + nextAttribute + '"]';
        selectorFragment += (axeRule.axeSelector[(newSegment + 1)] ? axeRule.axeSelector[(newSegment + 1)] : '');
        segment = newSegment;
    }

    for (let a = (axeRule.axeIndex * 100); a < ((axeRule.axeIndex * 100) + (segment - 1)); a++) {
        let elements = document.querySelectorAll('[data-axe-' + a + ']');
        elements.forEach(function(element){
            element.removeAttribute('data-axe-' + a);
        });
    }

    // console.log(selectorFragment + '{' + styleString(axeRule.axeStyles) + '}');
    document.styleSheets[0].insertRule(selectorFragment + '{' + styleString(axeRule.axeStyles) + '}', axeRule.axeIndex);

    if (axeRule.axeSelector[0].match(/\:hover|\:click|\:rightclick|\:doubleclick|\:keypress|\:mousemove|\:resize|\:scroll|\:blur|\:focus|\:change|\:invalid|\:reset|\:search|\:select|\:submit/)) {
        let pseudoElement = axeRule.axeSelector[0].replace(/[^\:]+(\:[^\s]+).*/,'$1');

        switch (pseudoElement) {
            case(':hover') : pseudoHover(axeRule); break;
            case(':click') : pseudoClick(axeRule); break;
            case(':rightclick') : pseudoRightClick(axeRule); break;
            case(':doubleclick') : pseudoDoubleClick(axeRule); break;
            case(':keypress') : pseudoKeyPress(axeRule); break;
            case(':mousemove') : pseudoMouseMove(axeRule); break;
            case(':resize') : pseudoResize(axeRule); break;
            case(':scroll') : pseudoScroll(axeRule); break;
            case(':blur') : pseudoBlur(axeRule); break;
            case(':focus') : pseudoFocus(axeRule); break;
            case(':change') : pseudoChange(axeRule); break;
            case(':invalid') : pseudoInvalid(axeRule); break;
            case(':reset') : pseudoReset(axeRule); break;
            case(':search') : pseudoSearch(axeRule); break;
            case(':select') : pseudoSelect(axeRule); break;
            case(':submit') : pseudoSubmit(axeRule); break;
        }
    }
}



let styleSheetPaths = [];
document.querySelectorAll('[rel="stylesheet"]').forEach(function(styleSheetLink, i){
   styleSheetPaths[i] = styleSheetLink.getAttribute('href');
});

const axeStylesElement = document.createElement('axe-styles');
document.head.appendChild(axeStylesElement);

const symbols = ['<','^','%','|','?','!'];
getAxeStyles();

const reverseSymbol = (query) => {
    for (let q = 0; q < query.length; q++) {
        query[q] = query[q].replace(/\>/,'<');
        query[q] = query[q].replace(/\s/,'^');
        query[q] = query[q].replace(/\+/,'?');
        query[q] = query[q].replace(/\~/,'!');
    }
}

const convertQuery = (query) => {

    for (let b = 0; b < query.length; b++) {
        if (query[b].match(/\:/)) {
           let axis = b;
        }
    }
 
    let bladeArray = new Array(query[axis]);
    let a = (axis - 1);
    let c = (axis + 1);

    while ((a > -1) && (symbols.indexOf(query[a]) < 0)) {
        bladeArray.unshift(query[a]);
        a--;
    }

    while ((c < query.length) && (symbols.indexOf(query[c]) < 0)) {
        bladeArray.push(query[c]);
        c++;
    }

    bladeArray.shift();

    for (let b = 0; b < bladeArray.length; b++) {
        if (bladeArray[b].match(/\:/)) {
           let bladeStart = b;
        }
    }

    let bladeCoverArray = bladeArray.slice();
    let bladeEdgeArray = bladeArray.slice(bladeStart);
    let newBladeArray = bladeEdgeArray.slice();

    bladeCoverArray[bladeStart] = bladeCoverArray[bladeStart].replace(':hover','');

    newBladeArray.pop();
    newBladeArray.reverse();
    reverseSymbol(newBladeArray);

    for (let bladeCover = (bladeCoverArray.length - 1); bladeCover > -1; bladeCover--) {
        newBladeArray.unshift(bladeCoverArray[bladeCover]);
    }


    for (let bladeEdge = 1; bladeEdge < bladeEdgeArray.length; bladeEdge++) {
        newBladeArray.push(bladeEdgeArray[bladeEdge]);
    }

    let startOfQuery = query.slice(0, (axis - bladeStart));
    let endOfQuery = query.slice((startOfQuery.length + bladeArray.length));
    let query = startOfQuery.concat(newBladeArray).concat(endOfQuery);

    return query;
}
