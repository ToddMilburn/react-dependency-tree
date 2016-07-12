// VENDOR LIBS
var React = require('react');
var classNames = require('classnames');

var DependencyNode = React.createClass({

    propTypes: {
        child: React.PropTypes.bool,
        highlight: React.PropTypes.bool,
        wide: React.PropTypes.bool,
        parent: React.PropTypes.bool,
        passThru: React.PropTypes.bool,
        renderTextCallback: React.PropTypes.func.isRequired,
        syblingAbove: React.PropTypes.bool,
        syblingBelow: React.PropTypes.bool
    },

    getDefaultProps: function () {
        return {
            child: false,
            highlight: false,
            wide: false,
            parent: false,
            passThru: false,
            syblingAbove: false,
            syblingBelow: false
        }
    },

    render: function () {
        return (
            <span>
                <span className="dependency-node--graphic">
                    <span className={this.getFrontTopGraphicClassName()} />
                    <span className={this.getFrontBottomGraphicClassName()} />
                </span>
                {this.renderNode()}
                <span className="dependency-node--graphic">
                    <span className={this.getBackTopGraphicClassName()} />
                    <span className={this.getBackBottomGraphicClassName()} />
                </span>
            </span>
        );
    },

    renderNode: function () {
        var content = this.props.renderTextCallback();

        if (content) {
            content = (
                <span className={this.getNodeClassName()}>
                    <span className={this.getNodePaddingClassName()}>
                        {content}
                    </span>
                </span>
            );
        }

        return content;
    },

    getFrontTopGraphicClassName: function () {
        var classes = {
            'dependency-node--graphic_front-top': true,
            'dependency-node--graphic_has-parent': this.props.child,
            'dependency-node--graphic_sybling-above': this.props.syblingAbove,
            'dependency-node--graphic_pass-thru': this.props.passThru
        };

        return classNames(classes);
    },

    getFrontBottomGraphicClassName: function () {
        var classes = {
            'dependency-node--graphic_front-bottom': true,
            'dependency-node--graphic_sybling-below': this.props.syblingBelow,
            'dependency-node--graphic_pass-thru': this.props.passThru
        };

        return classNames(classes);
    },

    getBackTopGraphicClassName: function () {
        var classes = {
            'dependency-node--graphic_back-top': true,
            'dependency-node--graphic_has-child': this.props.parent
        };

        return classNames(classes);
    },

    getBackBottomGraphicClassName: function () {
        var classes = {
            'dependency-node--graphic_back-bottom': true
        };

        return classNames(classes);
    },

    getNodeClassName: function () {
        var classes = {
            'dependency-node--content': true,
            'dependency-node--content_highlight': this.props.highlight,
            'dependency-node--content_wide': this.props.wide
        };

        return classNames(classes);
    },

    getNodePaddingClassName: function () {
        var classes = {
            'dependency-node--content-padding': true,
            'dependency-node--content-padding_wide': this.props.wide
        };

        return classNames(classes);
    }
});

module.exports = DependencyNode;
