// NB: File-copy doesn't copy not modified file.
// NB: You should run code below before invoking 'enb make' command by request with express-bem-enb-make,
// otherwise this node will not be built.

module.exports = function(config, platforms) {
    var techs = this;

    config.node('public', function(nodeConfig) {
        var targets = [];

        platforms.forEach(function(platform) {
            var sourceNode = 'src/bundles/' + platform + '.bundles/index';

            ['.css', '.js'].forEach(function(extName) {
                var target = '_' + platform + extName;
                targets.push(target);

                nodeConfig.addTech([techs.files.symlink, {
                    source : '_?' + extName,   // make symlink to _?.css
                    sourceNode : sourceNode,   // from this bundle
                    target : target            // with path to public/_?.css
                }]);
            });
        });

        nodeConfig.addTargets(targets);
    });
};
