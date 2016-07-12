// VENDOR LIBS
var React = require('react');
var _ = require('lodash');
var classNames = require('classnames');
var DependencyNode = require('./dependency-node');

var DependencyTree = React.createClass({

    propTypes: {
        items: React.PropTypes.shape({
            alternateName: React.PropTypes.node,
            items: React.PropTypes.array.isRequired,
            nodeName: React.PropTypes.node
        }).isRequired,
        viewType: React.PropTypes.string
    },

    getDefaultProps: function () {
        return {
            viewType: 'alternate'
        };
    },

    getInitialState: function () {
        return this.initializeState(this.props);
    },

    componentWillReceiveProps: function (nextProps) {
        this.setState(this.initializeState(nextProps));
    },

    render: function () {
        return (
            <div className="dependency-tree">
                {this.state.nodes.map(this.renderColumn)}
            </div>
        );
    },

    renderColumn: function (column, index) {
        return (
            <ul className="dependency-tree--column" key={index}>
                {column.map(this.renderDetail)}
            </ul>
        );
    },

    renderDetail: function (item, index) {
        return (
            <li className="dependency-tree--node-group" key={index}>
                <DependencyNode {...this.getNodeProps(item, index)} />
            </li>
        );
    },

    getNodeProps: function (item, index) {
        var connectionProps = this.getConnections(item, index);
        var props = {
            highlight: (this.state.mainNodeName === item.nodeName),
            wide: (this.state.viewType === 'alternate'),
            renderTextCallback: this.renderTextCallback.bind(this, item)
        };

        return _.extend(props, connectionProps);
    },

    getConnections: function (item, index) {
        var parent = item.parent;
        var syblingAbove = (parent && parent.firstChild !== parent.lastChild && parent.firstChild !== index);
        var syblingBelow = (parent && parent.firstChild !== parent.lastChild && parent.lastChild !== index);

        return {
            child: (parent !== undefined),
            parent: (item.firstChild !== undefined),
            passThru: item.inBetween,
            syblingAbove: syblingAbove,
            syblingBelow: syblingBelow,
        };
    },

    renderTextCallback: function (item) {
        var content = (this.state.viewType === 'alternate') ? item.alternateName : item.nodeName;

        if (content) {
            content = (
                <span className={this.getTextClassName(item)}>
                    {content}
                </span>
            );
        }

        return content;
    },

    getTextClassName: function (item) {
        var classes = {
            'dependency-tree--node': true,
            'dependency-tree--node_large': (this.state.viewType === 'alternate'),
            'dependency-tree--node_main': (this.state.mainNodeName === item.nodeName)
        };

        return classNames(classes);
    },

    initializeState: function (props) {
        return {
            mainNodeName: props.items.nodeName.toUpperCase(),
            nodes: this.prepareAllData(props.items),
            viewType: props.viewType
        };
    },

    prepareAllData: function (allNodes) {
        var nodes = this.getNodeColumns(allNodes);
        var changed = true;

        this.getParents(nodes);
        this.addDefaultPositions(nodes);
        this.addChildPositions(nodes);

        while (changed) {
            changed = 0;
            changed += this.positionParentInCenterOfChildren(nodes);
            changed += this.moveChildrenDown(nodes);
            this.updateChildIndexFromChildDisplayPositions(nodes);
            this.fillInBlankCells(nodes);
            this.addRelationshipIndicators(nodes);
        }

        return nodes;
    },

    getNodeColumns: function (node) {
        var nodes = [];
        var grandfatherNode = [{
            nodeName: node.nodeName.toUpperCase(),
            alternateName: (node.alternateName) ? node.alternateName.toUpperCase() : '',
            displayPosition: 0
        }];

        nodes = this.buildNodeColumns(node, 0, 0, nodes);

        // add in first column for the 'main' node'
        nodes.unshift(grandfatherNode);

        return nodes;
    },

    buildNodeColumns: function (node, level, parentIndex, nodes) {
        node.items.forEach(function (childNode) {

            if (!nodes[level]) {
                nodes[level] = [];
            }

            nodes[level].push({
                nodeName: childNode.nodeName,
                alternateName: childNode.alternateName,
                parent: parentIndex,
                displayPosition: nodes[level].length
            });

            if (childNode.items.length) {
                this.buildNodeColumns(childNode, level + 1, nodes[level].length - 1, nodes);
            }
        }, this);

        return nodes;
    },

    // this method converts the parent from an index (number) to a reference to the parent object
    getParents: function (nodes) {
        nodes.forEach(function (childNode, index) {

            if (index > 0) {
                childNode.forEach(function (child) {
                    child.parent = nodes[index - 1][child.parent];
                });
            }
        });
    },

    addDefaultPositions: function (nodes) {
        nodes.forEach(function (column, index) {

            if (index > 0) {
                column.forEach(function (node, nodeIndex) {
                    node.displayPosition = nodeIndex;
                });
            }
        });
    },

    // initialize for each parent an element for firstChild and lastChild
    addChildPositions: function (nodes) {
        var parentName;

        nodes.forEach(function (column, columnIndex) {

            if (columnIndex > 0) {

                parentName = '';
                column.forEach(function (childNode, index) {

                    if (childNode.nodeName) {

                        if (parentName.length === 0) {
                            parentName = childNode.parent.nodeName;
                            childNode.parent.firstChild = index;
                        }

                        if (childNode.parent.nodeName !== parentName) {
                            childNode.parent.firstChild = index;
                            childNode.parent.lastChild = index;
                            parentName = childNode.parent.nodeName;
                        } else {
                            if (childNode.parent.firstChild === undefined) {
                                childNode.parent.firstChild = index;
                            }
                            childNode.parent.lastChild = index;
                        }
                    }
                }, this);
            }
        });
    },

    positionParentInCenterOfChildren: function (nodes) {
        var column;
        var displayPosition;
        var index;
        var middle;
        var nextColumn;
        var firstChild;
        var lastChild;
        var changed = false;

        function positionParent (parent, parentIndex) {
            if (parent.firstChild !== undefined) {
                firstChild = nextColumn[parent.firstChild];
                lastChild = nextColumn[parent.lastChild];

                middle = (lastChild.displayPosition - firstChild.displayPosition) / 2;
                displayPosition = firstChild.displayPosition + Math.floor(middle);
            } else {
                displayPosition = parent.displayPosition;
            }

            // don't position this node before previous sibling
            if (parentIndex && displayPosition <= column[parentIndex - 1].displayPosition) {
                displayPosition = column[parentIndex - 1].displayPosition + 1;
            }

            if (parent.displayPosition !== displayPosition) {
                changed = true;
            }

            parent.displayPosition = displayPosition;
        }

        for (index = nodes.length - 2; index >= 0; index -= 1) {

            column = nodes[index];
            nextColumn = nodes[index + 1];

            column.forEach(
                positionParent
            );
        }

        return changed;
    },

    // never allow lastChild of a parent to be above the parent
    moveChildrenDown: function (nodes) {
        var changed = false;
        var column;
        var delta;
        var nextColumn;

        function moveChildren (node) {
            if (node.lastChild !== undefined) {
                delta = node.displayPosition - nextColumn[node.lastChild].displayPosition;

                if (delta > 0) {
                    // move down all children in column from node.firstChild all the way down
                    this.moveDisplayPositionsDown(nextColumn, node.firstChild, delta);
                    changed = true;
                }
            }
        }

        for (index = 1; index < nodes.length - 1; index += 1) {

            column = nodes[index];
            nextColumn = nodes[index + 1];

            column.forEach(moveChildren.bind(this));
        }

        return changed;
    },

    moveDisplayPositionsDown: function (column, startingIndex, delta) {
        var index;

        for (index = startingIndex; index < column.length; index += 1) {
            column[index].displayPosition += delta;
        }
    },

    updateChildIndexFromChildDisplayPositions: function (nodes) {
        nodes.forEach(function (column, columnIndex) {

            if (columnIndex < nodes.length - 1) {
                column.forEach(function (node) {
                    if (node.firstChild !== undefined) {
                        node.firstChild = nodes[columnIndex + 1][node.firstChild].displayPosition;
                    }

                    if (node.lastChild !== undefined) {
                        node.lastChild = nodes[columnIndex + 1][node.lastChild].displayPosition;
                    }
                });
            }
        });
    },

    fillInBlankCells: function (nodes) {
        var columnData;

        nodes.forEach(function (column, columnIndex) {

            // create an array with an empty object for each value
            columnData = this.createArrayOfEmptyObjects(this.getLengthLongestColumn(nodes));

            column.forEach(function (node) {
                columnData[node.displayPosition] = node;
            });

            nodes[columnIndex] = columnData;
        }, this);
    },

    createArrayOfEmptyObjects: function (numberOfArrayItemsToCreate) {
        var arrayOfEmptyObjects = [];
        var loopIndex;

        for (loopIndex = numberOfArrayItemsToCreate; loopIndex > 0; loopIndex -= 1) {
            arrayOfEmptyObjects.push({});
        }

        return arrayOfEmptyObjects;
    },

    getLengthLongestColumn: function (nodes) {
        var lengthOfLongestColumn = 0;

        nodes.forEach(function (column) {
            lengthOfLongestColumn = Math.max(lengthOfLongestColumn, column.length);
        });

        return lengthOfLongestColumn;
    },

    addRelationshipIndicators: function (nodes) {
        var inBetweenMode = false;

        nodes.forEach(function (column, columnIndex) {

            if (columnIndex > 0 && columnIndex < nodes.length - 1) {

                inBetweenMode = false;
                column.forEach(function (childNode, index) {

                    if (childNode.parent && childNode.parent.firstChild === index) {
                        inBetweenMode = true;
                    }

                    if (inBetweenMode) {

                        if (!childNode.nodeName) {
                            childNode.inBetween = true;
                        }
                    }

                    if (childNode.parent && childNode.parent.lastChild === index) {
                        inBetweenMode = false;
                    }
                });
            }
        });
    }
});

module.exports = DependencyTree;
