## axe (ACSSSS) - Augmented Cascading Style Sheet Selector Syntax

**axe selectors** are an *extension* to the official selector syntax of Cascading Style Sheets (.css files).

**axe selectors** enable the selection of:

 - parent elements
 - ancestor elements
 - preceding sibling elements

**axe selectors** also enable the selection of _any_ other element in the document by id, class, attribute or type.


# Existing CSS Symbol Selectors

- **+** - immediately subsequent sibling selector
- **~** - any subsequent sibling selector
- **>** - immediate child selector
- **[SPACE]** - any descendant selector

# Axe CSS Symbol Selectors

- **?** - immediately preceding sibling selector
- **!** - any preceding sibling selector
- **%** - immediately adjacent sibling selector
- **|** - any sibling selector
- **<** - immediate parent selector
- **^** - any ancestor selector
- **\** - any other element selector
