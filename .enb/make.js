var path = require('path');
var platforms = ['project'];
var techs = {
    bem : require('enb-bem-techs'),
    borschik : require('enb-borschik/techs/borschik'),
    engines : {
        bemtree: require('enb-bemxjst/techs/bemtree'),
        bemhtml : require('enb-bemxjst/techs/bemhtml')
    },
    files : {
        copy : require('enb/techs/file-copy'),
        merge : require('enb/techs/file-merge'),
        provide : require('enb/techs/file-provider'),
        symlink : require('./techs/symlink-extra')
    },
    browserJs: require('enb-js/techs/browser-js'),
    postCss : require('enb-postcss/techs/enb-postcss'),
    projectSymlinks : require('./techs/project-symlinks')
};

module.exports = function(config) {

    /**
     * MAIN STAGE
     */
    platforms.forEach(function(platform) {
        config.nodes(['src/bundles/' + platform + '.bundles/*'], function(nodeConfig) {
            var isMergedNode = path.basename(nodeConfig.getPath()) === 'merged';

            // Start point
            nodeConfig.addTech([techs.files.provide, { target : '?.bemdecl.js' }]);

            nodeConfig.addTechs([

                // Levels
                [techs.bem.levels, { levels : [
                    { path : 'src/libs/bem-core/common.blocks', check : false },
                    { path : 'src/libs/bem-core/desktop.blocks', check : false },
                    { path : 'src/libs/bem-components/common.blocks', check: false },
                    { path : 'src/libs/bem-components/desktop.blocks', check: false },
                    { path : 'src/libs/bem-components/design/common.blocks', check: false },
                    { path : 'src/libs/bem-components/design/desktop.blocks', check: false },
                    'src/blocks/common.blocks',
                    'src/blocks/' + platform + '.blocks'
                ]}],

                // Base techs
                [techs.bem.deps],
                [techs.bem.files],

                // CSS
                [techs.postCss, {
                    comments : false,
                    sourcemap : true,
                    plugins : [
                        require('stylelint')(
                            Object.assign({},
                                require('stylelint-config-manufactura')
                                // { ignoreFiles : 'src/bundles/**/*.css' }
                            )
                        ),
                        require('postcss-import'),
                        require('autoprefixer')({
                            browsers : [
                                'last 2 versions',
                                'ie >= 10'
                            ]
                        }),
                        require('postcss-simple-vars')({
                            variables : {}
                        }),
                        require('postcss-custom-media'),
                        require('postcss-nested'),
                        require('postcss-easings'),
                        require('postcss-color-function'),
                        require('postcss-flexbugs-fixes'),
                        require('postcss-reporter')({
                            clearMessages : true
                        })
                    ]
                }],

                // JS
                [techs.browserJs, { includeYM : true }],
                [techs.files.merge, {
                    target : '?.js',
                    sources : ['?.browser.js', '?.browser.bemhtml.js']
                }],

                // JS techs
                [techs.bem.depsByTechToBemdecl, {
                    target : '?.js-js.bemdecl.js',
                    sourceTech : 'js',
                    destTech : 'js'
                }],
                [techs.bem.mergeBemdecl, {
                    sources : ['?.bemdecl.js', '?.js-js.bemdecl.js'],
                    target : '?.js.bemdecl.js'
                }],
                [techs.bem.deps, {
                    target : '?.js.deps.js',
                    bemdeclFile : '?.js.bemdecl.js'
                }],
                [techs.bem.files, {
                    depsFile : '?.js.deps.js',
                    filesTarget : '?.js.files',
                    dirsTarget : '?.js.dirs'
                }],

                // Client template engine
                [techs.bem.depsByTechToBemdecl, {
                    target : '?.template.bemdecl.js',
                    sourceTech : 'js',
                    destTech : 'bemhtml'
                }],
                [techs.bem.deps, {
                    target : '?.template.deps.js',
                    bemdeclFile : '?.template.bemdecl.js'
                }],
                [techs.bem.files, {
                    depsFile : '?.template.deps.js',
                    filesTarget : '?.template.files',
                    dirsTarget : '?.template.dirs'
                }],
                [techs.engines.bemhtml, {
                    target : '?.browser.bemhtml.js',
                    filesTarget : '?.template.files',
                    devMode : false
                }],

                // Template engines
                [techs.engines.bemtree, { sourceSuffixes: ['bemtree', 'bemtree.js'] }],
                [techs.engines.bemhtml, { sourceSuffixes: ['bemhtml', 'bemhtml.js'] }]
            ]);

            nodeConfig.addTargets(
                ['_?.css', '_?.js', '_?.bemhtml.js', '_?.bemtree.js']
            );
        });
    });


    config.mode('development', function() {
        platforms.forEach(function(platform) {
            config.nodes(['src/bundles/' + platform + '.bundles/*'], function(nodeConfig) {
                nodeConfig.addTechs([
                    [techs.borschik, { sourceTarget : '?.bemtree.js', destTarget : '_?.bemtree.js', freeze : false, minify : false, noCache : false }],
                    [techs.borschik, { sourceTarget : '?.bemhtml.js', destTarget : '_?.bemhtml.js', freeze : false, minify : false, noCache : false }],
                    [techs.borschik, { source : '?.css', target : '_?.css', freeze : true, minify : false }],
                    [techs.borschik, { source : '?.js', target : '_?.js', freeze : true, minify : false }]
                ]);
            });
        });

        techs.projectSymlinks(config, platforms);
    });

    config.mode('production', function() {
        platforms.forEach(function(platform) {
            config.nodes(['src/bundles/' + platform.name + '.bundles/*'], function(nodeConfig) {
                nodeConfig.addTechs([
                    [techs.borschik, { sourceTarget : '?.bemtree.js', destTarget : '_?.bemtree.js', freeze : true, minify : true, noCache : true }],
                    [techs.borschik, { sourceTarget : '?.bemhtml.js', destTarget : '_?.bemhtml.js', freeze : true, minify : true, noCache : true }],
                    [techs.borschik, { source : '?.css', target : '_?.css', freeze : true, minify : true, tech : 'cleancss' }],
                    [techs.borschik, { source : '?.js', target : '_?.js', freeze : true, minify : true }]
                ]);
            });
        });

        techs.projectSymlinks(config, platforms);
    });
};
