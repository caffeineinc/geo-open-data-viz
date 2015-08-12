'use strict';

var fs = require('fs');
var handlebars = require('handlebars');
var markdown = require('markdown');
var _ = require('lodash');

function convertMarkdownItem(item) {
  return item;
}

function extractStructureFromMarkdownML(markdownMl) {
  var markdownTree = { children: [] };
  var currentElt = markdownTree;
  var currentLevel = 0;
  var currentChildren = markdownTree.children;

  _.forEach(markdownMl, function(item) {
    if (item === 'markdown') {
      return;
    }

    if (_.isArray(item) && item[0] === 'header') {
      var level = item[1]['level'];
      //console.log('>> level = '+level+', currentLevel = '+currentLevel+', title = '+item[2]);
      if (level > currentLevel) {
        var header = {
          title: item[2],
          type: 'header',
          level: level,
          children: [],
          parent: currentElt
        };
        //console.log(' # attach on (1) '+currentElt.title);
        currentChildren.push(header);
        currentLevel++;
        currentElt = header;
        currentChildren = header.children;
      } else if (level === currentLevel) {
        currentElt = currentElt.parent;
        currentChildren = currentElt.children;
        var header = {
          title: item[2],
          type: 'header',
          level: level,
          children: [],
          parent: currentElt
        };
        //console.log(' # attach on (1) '+currentElt.title);
        currentChildren.push(header);
        currentElt = header;
        currentChildren = header.children;
      } else if (level < currentLevel) {
        for (var i = 0; i < currentLevel - level + 1; i++) {
          currentElt = currentElt.parent;
        }
        currentChildren = currentElt.children;
        var header = {
          title: item[2],
          type: 'header',
          level: level,
          children: [],
          parent: currentElt
        };
        //console.log(' # attach on (2) '+currentElt.title);
        currentChildren.push(header);
        currentElt = header;
        currentChildren = header.children;
        currentLevel = level;
      }
    } else {
      currentChildren.push(convertMarkdownItem(item));
    }
  });

  return markdownTree;
}

function formatMarkdownML(markdownMl) {
  return _.map(markdownMl, function(item) {
    if (_.isString(item)) {
      return {
        type: 'intro'
      };
    }

    if (item[0] === 'header') {
      return {
        type: 'header',
        title: item[2],
        properties: item[1]
      };
    } else if (item[0] === 'para') {
      if (_.isString(item[1])) {
        var content = [];

        _.forEach(item, function(element, i) {
          if (i > 0) {
            if (_.isString(element)) {
              content.push(element);
            } else if (_.isArray(element)) {
              if (element[0] === 'inlinecode') {
                content.push('<code>');
                content.push(element[1]);
                content.push('</code>');
              }
              if (element[0] === 'link') {
                content.push('<a href="');
                content.push(element[1].href);
                content.push('">');
                content.push(element[2]);
                content.push('</a>');
              }
            }
          }
        });
        return {
          type: 'para',
          content: content.join('')
        };
      } else if (_.isArray(item[1]) && item[1][0] === 'inlinecode') {
        return {
          type: 'inlinecode',
          content: item[1][1]
        };
      }
    } else if (item[0] === 'table') {
      var thead = item[1];
      var tbody = item[2];

      var content = [ '<div class="table-responsive">' +
        '<table class="table table-bordered table-striped"><thead><tr>'];

      _.forEach(thead[1], function(element) {
        if (_.isString(element)) {
          // Do nothing
        } else if (_.isArray(element)) {
          content.push('<th>');
          content.push(element[2]);
          content.push('</th>');
        }
      });
      content.push('</tr></thead><tbody>');

      _.forEach(tbody, function(trElement) {
        content.push('<tr>');
        _.forEach(trElement, function(tdElement) {
          if (_.isString(tdElement)) {
            // Do nothing
          } else if (_.isArray(tdElement)) {
            content.push('<td>');
            content.push(tdElement[2]);
            content.push('</td>');
          }
        });
        content.push('</tr>');
      });

      content.push('</tbody></table></div>');
      return {
        type: 'table',
        content: content.join('')
      };
    }
  });
}

handlebars.registerHelper('ifCond', function(val1, val2, options) {
  if (val1 === val2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('generateSectionId', function(val) {
  var id = val.replace(/ /g, '-');
  return new handlebars.SafeString(id.toLowerCase());
});

handlebars.registerHelper('trim', function(val) {
  return new handlebars.SafeString(val.trim());
});

function generatePage(docFile, outputFile, properties) {
  fs.readFile('docs/templates/index.html', 'utf8', function(err, source) {
    var template = handlebars.compile(source);

    fs.readFile(docFile, 'utf8', function(err, data) {
      var markdownContent = new markdown.markdown.Markdown('Maruku');
      var markdownMl = markdownContent.toTree(data);
      console.log('mk = '+JSON.stringify(markdownMl, null, 2));

      var content = formatMarkdownML(markdownMl);
      var structure = extractStructureFromMarkdownML(markdownMl);

      //console.log('content = '+util.inspect(content));

      //_.forEach(content.children, function(elt) {
      //  console.log('- elt = '+elt.title);
      //  _.forEach(elt.children, function(elt1) {
      //    console.log('  - elt = '+elt1.title);
      //    if (elt1.children) {
      //      _.forEach(elt1.children, function(elt2) {
      //        console.log('    - elt = '+elt2.title);
      //      });
      //    }
      //  });
      //});

      var html = template({
        raw: content,
        structure: structure,
        properties: properties
      });
      //console.log('html = '+html);

      fs.writeFile(outputFile, html, function(err) {
        if (err) {
          throw err;
        }

        console.log('Written file ' + outputFile);
      });
    });
  });
}

// Home

generatePage('docs/reference/home.md', 'docs/site/index.html', {
  title: 'Map visualizer',
  description: 'Visualize easily your data on maps',
  category: 'home',
  page: 'home'
});

// Web UI

// DSL

generatePage('docs/reference/dsl/map.md', 'docs/site/dsl-map.html', {
  title: 'Map DSL',
  description: 'Configure maps using the JSON format and literal JavaScript objects.',
  category: 'dsl',
  page: 'dsl-map'
});
generatePage('docs/reference/dsl/layer.md', 'docs/site/dsl-layer.html', {
  title: 'Layer DSL',
  description: 'Configure layers using the JSON format and literal JavaScript objects.',
  category: 'dsl',
  page: 'dsl-layer'
});

// Web API

// Howtos

// Tools
generatePage('docs/reference/tools/installers.md', 'docs/site/tools-installing.html', {
  title: 'Installing',
  description: 'Install the application on an execution platform',
  category: 'tools',
  page: 'tools-installing'
});