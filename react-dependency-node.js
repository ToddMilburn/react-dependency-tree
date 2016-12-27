// VENDOR LIBS
var React = require('react');
var classNames = require('classnames');

var ReactDependencyNode = React.createClass({

    propTypes: {
        applicable: React.PropTypes.bool,
        child: React.PropTypes.bool,
        dark: React.PropTypes.bool,
        item: React.PropTypes.object,
        bright: React.PropTypes.bool,
        parent: React.PropTypes.bool,
        passThru: React.PropTypes.bool,
        renderNodeCallback: React.PropTypes.func.isRequired,
        size: React.PropTypes.oneOf(['small', 'medium', 'large']),
        syblingAbove: React.PropTypes.bool,
        syblingBelow: React.PropTypes.bool
    },

    getDefaultProps: function () {
        return {
            applicable: true,
            child: false,
            dark: false,
            bright: false,
            parent: false,
            passThru: false,
            size: 'medium',
            syblingAbove: false,
            syblingBelow: false
        }
    },

    render: function () {
        return (
            <span className={this.getClass()}>
                <span className={this.getGraphicClass()}>
                    <span className={this.getFrontTopGraphicClassName()} />
                    <span className={this.getFrontBottomGraphicClassName()} />
                </span>
                {this.renderNode()}
                <span className={this.getGraphicClass()}>
                    <span className={this.getBackTopGraphicClassName()} />
                    <span className={this.getBackBottomGraphicClassName()} />
                </span>
            </span>
        );
    },

    renderNode: function () {
        var content = this.props.renderNodeCallback(this.props.item);

        if (content) {
            content = (
                <span className={this.getNodeClassName()}>
                    <span className={this.getContentClassName()}>
                        {content}
                    </span>
                </span>
            );
        }

        return content;
    },

    getClass: function () {
        var classes = {
            'react-dependency-node': true,
            'react-dependency-node_large': (this.props.size === 'large'),
            'react-dependency-node_small': (this.props.size === 'small')
        };

        return classNames(classes);
    },

    getGraphicClass: function () {
        var classes = {
            'react-dependency-node--connector': true,
            'react-dependency-node--connector_small': (this.props.size === 'small'),
            'react-dependency-node--connector_large': (this.props.size === 'large')
        };

        return classNames(classes);
    },

    getFrontTopGraphicClassName: function () {
        var classes = {
            'react-dependency-node--connector_front-top': true,
            'react-dependency-node--connector_has-parent': this.props.child,
            'react-dependency-node--connector_sybling-above': this.props.syblingAbove,
            'react-dependency-node--connector_pass-thru': this.props.passThru
        };

        return classNames(classes);
    },

    getFrontBottomGraphicClassName: function () {
        var classes = {
            'react-dependency-node--connector_front-bottom': true,
            'react-dependency-node--connector_sybling-below': this.props.syblingBelow,
            'react-dependency-node--connector_pass-thru': this.props.passThru
        };

        return classNames(classes);
    },

    getBackTopGraphicClassName: function () {
        var classes = {
            'react-dependency-node--connector_back-top': true,
            'react-dependency-node--connector_has-child': this.props.parent
        };

        return classNames(classes);
    },

    getBackBottomGraphicClassName: function () {
        var classes = {
            'react-dependency-node--connector_back-bottom': true
        };

        return classNames(classes);
    },

    getNodeClassName: function () {
        var classes = {
            'react-dependency-node--node': true,
            'react-dependency-node--node_dark': (this.props.dark),
            'react-dependency-node--node_large': (this.props.size === 'large'),
            'react-dependency-node--node_bright': (this.props.bright),
            'react-dependency-node--node_small': (this.props.size === 'small')
        };

        return classNames(classes);
    },

    getContentClassName: function () {
        var classes = {
            'react-dependency-node--content': true,
            'react-dependency-node--content_small': (this.props.size === 'small'),
            'react-dependency-node--content_large': (this.props.size === 'large')
        };

        return classNames(classes);
    }
});

module.exports = ReactDependencyNode;
