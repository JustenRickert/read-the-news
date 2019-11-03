const { parse, NodeType } = require("node-html-parser");

const concatAstRawText = ast =>
  ast.childNodes.reduce((text, child) => {
    switch (child.nodeType) {
      case NodeType.ELEMENT_NODE:
        return text + concatAstRawText(child);
      case NodeType.TEXT_NODE:
        return text + child.rawText;
      default:
        console.error("case:", child.nodeType);
        throw new Error("case not handled");
    }
  }, "");

const removeHtmlTags = htmlString => {
  const ast = parse(`<div>${htmlString}</div>`);
  return concatAstRawText(ast);
};

const astWithLinkSplits = (ast, text = "", links = []) =>
  // TODO(?) maybe check top level `ast`?
  ast.childNodes.reduce(
    ({ text, links }, child) => {
      switch (child.nodeType) {
        case NodeType.ELEMENT_NODE:
          switch (child.tagName) {
            case "strong": {
              const { text: newText, links: newLinks } = astWithLinkSplits(
                child,
                text,
                links
              );
              return {
                text: text + newText,
                links: links.concat(newLinks)
              };
            }
            case "p": {
              const { text: newText, links: newLinks } = astWithLinkSplits(
                child,
                text,
                links
              );
              return {
                text: text + newText + "\n",
                links: links.concat(newLinks)
              };
            }
            case "a": {
              const { text: newText, newLinks } = astWithLinkSplits(
                child,
                text,
                links
              );
              return {
                text: text + newText,
                links: links.concat(child.attributes.href)
              };
            }
            default:
              console.error(child);
              throw new Error("Element type not handled");
          }
          break;
        case NodeType.TEXT_NODE:
          return {
            text: text + child.rawText,
            links
          };
          break;
      }
      console.log("why am I here?");
    },
    { text: "", links: [] }
  );

module.exports = {
  removeHtmlTags
};
