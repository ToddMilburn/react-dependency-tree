// VENDOR LIBS
var React = require('react');
var classNames = require('classnames');

var DependencyTree = React.createClass({

    propTypes: {
        items: React.PropTypes.shape({
            items: React.PropTypes.array.isRequired,
            nodeName: React.PropTypes.node,
            alternateName: React.PropTypes.node
        }).isRequired,
        viewType: React.PropTypes.string
    },

    getDefaultProps: function () {
        return {
            viewType: 'alternate'
        };
    },

    getInitialState: function () {
        return {
            mainNodeName: this.props.items.nodeName.toUpperCase(),
            nodes: this.prepareAllData(this.props.items)
        };
    },

    componentWillReceiveProps: function (nextProps) {
        this.setState({
            mainNodeName: nextProps.items.nodeName.toUpperCase(),
            nodes: this.prepareAllData(nextProps.items),
            viewType: nextProps.viewType
        });
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
                <span className="dependency-tree--graphic">
                    <span className={this.getFrontTopGraphicClassName(item, index)} />
                    <span className={this.getFrontBottomGraphicClassName(item, index)} />
                </span>
                {this.renderNodeName(item)}
                <span className="dependency-tree--graphic">
                    <span className={this.getBackTopGraphicClassName(item, index)} />
                    <span className={this.getBackBottomGraphicClassName(item, index)} />
                </span>
            </li>
        );
    },

    renderNodeName: function (item) {
        var renderedName = null;

        if (item.nodeName) {
            renderedName = (
                <span className={this.getTextBlockClassName(item)}>
                    <span className="dependency-tree--text-block-padding">
                        <span className={this.getTextClassName(item)}>
                            {(this.props.viewType === 'alternate') ? item.nodeName : item.alternateName}
                        </span>
                    </span>
                </span>
            );
        }

        return renderedName;
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
            alternateName: node.alternateName.toUpperCase(),
            parent: 0,
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
        // var changed = false;

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

        // return changed;
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
    },

    getFrontTopGraphicClassName: function (item, index) {
        var parent = item.parent;
        var hasParent = (parent);
        var hasSiblingAbove = (parent && parent.firstChild !== parent.lastChild && parent.firstChild !== index);
        var classes = {
            'dependency-tree--graphic_front-top': true,
            'dependency-tree--graphic_has-parent': hasParent,
            'dependency-tree--graphic_front-top-sibling': hasSiblingAbove,
            'dependency-tree--graphic_in-between': item.inBetween
        };

        return classNames(classes);
    },

    getFrontBottomGraphicClassName: function (item, index) {
        var parent = item.parent;
        var hasParentBelow = (parent && item.displayPosition < parent.displayPosition);
        var hasSiblingBelow = (parent && parent.firstChild !== parent.lastChild && parent.lastChild !== index);
        var classes = {
            'dependency-tree--graphic_front-bottom': true,
            'dependency-tree--graphic_parent-below': hasParentBelow,
            'dependency-tree--graphic_front-bottom-sibling': hasSiblingBelow,
            'dependency-tree--graphic_in-between': item.inBetween
        };

        return classNames(classes);
    },

    getBackTopGraphicClassName: function (item) {
        var classes = {
            'dependency-tree--graphic_back-top': true,
            'dependency-tree--graphic_has-child': (item.firstChild !== undefined)
        };

        return classNames(classes);
    },

    getBackBottomGraphicClassName: function () {
        var classes = {
            'dependency-tree--graphic_back-bottom': true
        };

        return classNames(classes);
    },

    getTextBlockClassName: function (item) {
        var classes = {
            'dependency-tree--text-block': true,
            'dependency-tree--main-text-block': (item.nodeName === this.state.mainNodeName)
        };

        return classNames(classes);
    },

    getTextClassName: function (item) {
        var classes = {
            'dependency-tree--node': true,
            'dependency-tree--main-node': (item.nodeName === this.state.mainNodeName)
        };

        return classNames(classes);
    }
});

module.exports = DependencyTree;
