// VENDOR LIBS
var React = require('react');
var classNames = require('classnames');

var ReactDependencyNode = React.createClass({

    propTypes: {
        child: React.PropTypes.bool,
        highlight: React.PropTypes.bool,
        parent: React.PropTypes.bool,
        passThru: React.PropTypes.bool,
        renderNodeCallback: React.PropTypes.func.isRequired,
        syblingAbove: React.PropTypes.bool,
        syblingBelow: React.PropTypes.bool,
        tall: React.PropTypes.bool,
        wide: React.PropTypes.bool
    },

    getDefaultProps: function () {
        return {
            child: false,
            highlight: false,
            parent: false,
            passThru: false,
            syblingAbove: false,
            syblingBelow: false,
            tall: false,
            wide: false
        }
    },

    render: function (item) {
        return (
            <span className={this.getClass()}>
                <span className={this.getGraphicClass()}>
                    <span className={this.getFrontTopGraphicClassName()} />
                    <span className={this.getFrontBottomGraphicClassName()} />
                </span>
                {this.renderNode(item)}
                <span className={this.getGraphicClass()}>
                    <span className={this.getBackTopGraphicClassName()} />
                    <span className={this.getBackBottomGraphicClassName()} />
                </span>
            </span>
        );
    },

    renderNode: function (item) {
        var content = this.props.renderNodeCallback(item);

        if (content) {
            content = (
                <span className={this.getNodeClassName()}>
                    <span className={this.getNodePaddingClassName()}>
                        <span className={this.getContentClassName()}>
                            {content}
                        </span>
                    </span>
                </span>
            );
        }

        return content;
    },

    getClass: function () {
        var classes = {
            'react-dependency-node': true,
            'react-dependency-node_tall': this.props.tall
        };

        return classNames(classes);
    },

    getGraphicClass: function () {
        var classes = {
            'react-dependency-node--graphic': true,
            'react-dependency-node--graphic_wide': this.props.wide
        };

        return classNames(classes);
    },

    getFrontTopGraphicClassName: function () {
        var classes = {
            'react-dependency-node--graphic_front-top': true,
            'react-dependency-node--graphic_has-parent': this.props.child,
            'react-dependency-node--graphic_sybling-above': this.props.syblingAbove,
            'react-dependency-node--graphic_pass-thru': this.props.passThru
        };

        return classNames(classes);
    },

    getFrontBottomGraphicClassName: function () {
        var classes = {
            'react-dependency-node--graphic_front-bottom': true,
            'react-dependency-node--graphic_sybling-below': this.props.syblingBelow,
            'react-dependency-node--graphic_pass-thru': this.props.passThru
        };

        return classNames(classes);
    },

    getBackTopGraphicClassName: function () {
        var classes = {
            'react-dependency-node--graphic_back-top': true,
            'react-dependency-node--graphic_has-child': this.props.parent
        };

        return classNames(classes);
    },

    getBackBottomGraphicClassName: function () {
        var classes = {
            'react-dependency-node--graphic_back-bottom': true
        };

        return classNames(classes);
    },

    getNodeClassName: function () {
        var classes = {
            'react-dependency-node--node': true,
            'react-dependency-node--node_highlight': this.props.highlight,
            'react-dependency-node--node_tall': this.props.tall,
            'react-dependency-node--node_wide': this.props.wide
        };

        return classNames(classes);
    },

    getNodePaddingClassName: function () {
        var classes = {
            'react-dependency-node--node-padding': true,
            'react-dependency-node--node-padding_tall': this.props.tall,
            'react-dependency-node--node-padding_wide': this.props.wide
        };

        return classNames(classes);
    },

    getContentClassName: function () {
        var classes = {
            'react-dependency-node--content': true,
            'react-dependency-node--content_tall': this.props.tall,
            'react-dependency-node--content_wide': this.props.wide
        };

        return classNames(classes);
    }
});

module.exports = ReactDependencyNode;
