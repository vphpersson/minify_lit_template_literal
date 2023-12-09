const fs = require('fs');

const estraverse = require('estraverse');
const esprima = require('esprima-next');
const escodegen = require('escodegen');
const postcss = require('postcss');
const postcss_minify = require('postcss-minify');

const minifyLitTemplateLiteral = (onload_options = {}) => {
    return {
        name: 'Minify Lit Template Literal',
        setup(build) {
            const postcss_processor = postcss(postcss_minify());

            build.onLoad(onload_options, async args => {
                const parse_script_result = esprima.parseScript(
                    await fs.promises.readFile(args.path, 'utf8'), {tolerant: true}
                );

                estraverse.replace(parse_script_result, {
                    enter: node => {
                        if (node.type === 'TaggedTemplateExpression') {
                            if (node.tag.name === 'css') {
                                node.quasi.quasis = node.quasi.quasis.map(q => {
                                    q.value = {raw: postcss_processor.process(q.value.raw).css.trim()};
                                    return q;
                                })
                            } else if (node.tag.name === 'html') {
                                node.quasi.quasis = node.quasi.quasis.map(q => {
                                    q.value = {
                                        raw: q.value.raw.replace(/(\n\s+|\s+\n)/gm, '')
                                    };
                                    return q;
                                });
                            }
                        }

                        return node;
                    }
                });

                return {contents: escodegen.generate(parse_script_result)};
            });
        }
    };
}

module.exports = {minifyLitTemplateLiteral};
