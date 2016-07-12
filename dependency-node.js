// VENDOR LIBS
var React = require('react');
var classNames = require('classnames');

var DependencyNode = React.createClass({

    propTypes: {
        item: React.PropTypes.shape({
            alternateContent: React.PropTypes.string,
            highlight: React.PropTypes.bool,
            large: React.PropTypes.bool,
            nodeContent: React.PropTypes.string,
            parent: React.PropTypes.bool,
            passThru: React.PropTypes.bool,
            renderAlternate: React.PropTypes.bool,
            syblingAbove: React.PropTypes.bool,
            syblingBelow: React.PropTypes.bool
        }).isRequired
    },

    getDefaultProps: function () {
        return {
            highlight: false,
            renderAlternate: true
        }
    },

    render: function () {
        var item = this.props.item;

        return (
            <span>
                <span className="dependency-node--graphic">
                    <span className={this.getFrontTopGraphicClassName(item)} />
                    <span className={this.getFrontBottomGraphicClassName(item)} />
                </span>
                {this.renderNodeName(this.props.item)}
                <span className="dependency-node--graphic">
                    <span className={this.getBackTopGraphicClassName(item)} />
                    <span className={this.getBackBottomGraphicClassName(item)} />
                </span>
            </span>
        );
    },

    renderNodeName: function (item) {
        var renderedName = null;

        if (item.nodeContent) {
            renderedName = (
                <span className={this.getTextBlockClassName(item)}>
                    <span className="dependency-node--text-block-padding">
                        <span className={this.getTextClassName(item)}>
                            {(item.renderAlternate) ? item.nodeContent : item.alternateContent}
                        </span>
                    </span>
                </span>
            );
        }

        return renderedName;
    },

    getFrontTopGraphicClassName: function (item) {
        var classes = {
            'dependency-node--graphic_front-top': true,
            'dependency-node--graphic_has-parent': (item.child),
            'dependency-node--graphic_sybling-above': item.syblingAbove,
            'dependency-node--graphic_pass-thru': item.passThru
        };

        return classNames(classes);
    },

    getFrontBottomGraphicClassName: function (item) {
        var classes = {
            'dependency-node--graphic_front-bottom': true,
            'dependency-node--graphic_sybling-below': item.syblingBelow,
            'dependency-node--graphic_pass-thru': item.passThru
        };

        return classNames(classes);
    },

    getBackTopGraphicClassName: function (item) {
        var classes = {
            'dependency-node--graphic_back-top': true,
            'dependency-node--graphic_has-child': item.parent
        };

        return classNames(classes);
    },

    getBackBottomGraphicClassName: function () {
        var classes = {
            'dependency-node--graphic_back-bottom': true
        };

        return classNames(classes);
    },

    getTextBlockClassName: function (item) {
        var classes = {
            'dependency-node--main-text-block': item.highlight,
            'dependency-node--text-block': true
        };

        return classNames(classes);
    },

    getTextClassName: function (item) {
        var classes = {
            'dependency-node--main-node': item.highlight,
            'dependency-node--node': true,
            'dependency-node--node_large': item.large
        };

        return classNames(classes);
    }
});

module.exports = DependencyNode;
