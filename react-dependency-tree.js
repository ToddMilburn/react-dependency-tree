// EXTERNAL VENDOR LIBS
var React = require('react');
var _ = require('lodash');
var classNames = require('classnames');

// INTERNAL LIBS
var DependencyNode = require('./dependency-node');

var DependencyTree = React.createClass({

    propTypes: {
        items: React.PropTypes.shape({
            alternateName: React.PropTypes.node,
            items: React.PropTypes.array.isRequired,
            nodeName: React.PropTypes.node.isRequired
        }).isRequired,
        renderNodeCallback: React.PropTypes.func.isRequired,
        tall: React.PropTypes.bool,
        wide: React.PropTypes.bool
    },

    getDefaultProps: function () {
        return {
            tall: false,
            wide: false
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
            <li key={index}>
                <DependencyNode {...this.getNodeProps(item, index)} />
            </li>
        );
    },

    getNodeProps: function (item, index) {
        var connectionProps = this.getConnections(item, index);
        var props = {
            highlight: (this.state.mainNodeName === item.nodeName),
            renderNodeCallback: this.props.renderNodeCallback.bind(null, item),
            tall: this.props.tall,
            wide: this.props.wide
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
            syblingBelow: syblingBelow
        };
    },

    initializeState: function (props) {
        return {
            mainNodeName: props.items.nodeName.toUpperCase(),
            nodes: this.prepareAllData(props.items)
        };
    },

    prepareAllData: function (allNodes) {
        var nodes = this.getNodeColumns(allNodes);
        var lastSnapShotChecksum = this.getNodeSnapShot(nodes);
        var refining = 1;
        var snapShotChecksum;

        this.getParents(nodes);
        this.addDefaultPositions(nodes);
        this.addChildPositions(nodes);

        while (refining && refining < 10) {
            this.positionParentInCenterOfChildren(nodes);
            this.moveChildrenDown(nodes);
            this.ensureAllChildrenAreContiguous(nodes);
            this.moveChildrenUp(nodes);
            this.positionParentInCenterOfChildren(nodes);
            this.updateChildIndexFromChildDisplayPositions(nodes);
            this.fillInBlankCells(nodes);
            this.addRelationshipIndicators(nodes);

            snapShotChecksum = this.getNodeSnapShot(nodes);

            if (lastSnapShotChecksum !== snapShotChecksum) {
                lastSnapShotChecksum = snapShotChecksum;
            } else {
                refining += 1;
            }
        }

        return nodes;
    },

    getNodeColumns: function (node) {
        var nodes = [];
        var grandfatherNode = [{
            alternateName: (node.alternateName) ? node.alternateName.toUpperCase() : '',
            displayPosition: 0,
            nodeName: node.nodeName.toUpperCase()
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
                alternateName: childNode.alternateName,
                displayPosition: nodes[level].length,
                nodeName: childNode.nodeName,
                parent: parentIndex
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
            if (parentIndex && column[parentIndex - 1] && displayPosition <= column[parentIndex - 1].displayPosition) {
                displayPosition = column[parentIndex - 1].displayPosition + 1;
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
    },

    removeGapsInChildren: function (nodes) {
        var childIndex;
        var column;
        var displayPosition;
        var index;
        var nextColumn;

        for (index = 1; index < nodes.length - 1; index += 1) {

            column = nodes[index];
            nextColumn = nodes[index + 1];

            column.forEach(function (node) {

                if (node.firstChild !== undefined) {

                    displayPosition = nextColumn[node.firstChild].displayPosition;

                    for (childIndex = node.firstChild + 1; childIndex <= node.lastChild; childIndex += 1) {
                        displayPosition += 1;

                        if (nextColumn[childIndex].displayPosition !== displayPosition) {
                            nextColumn[childIndex].displayPosition = displayPosition;
                        }
                    }
                }
            });
        }
    },

    removeOverlaps: function (nodes) {
        var lastDisplayPosition;

        function moveChildren (node) {
            if (lastDisplayPosition >= node.displayPosition) {
                node.displayPosition = lastDisplayPosition + 1;
            }
            lastDisplayPosition = node.displayPosition;
        }

        for (index = 1; index < nodes.length - 1; index += 1) {

            column = nodes[index];
            lastDisplayPosition = -1;

            column.forEach(moveChildren.bind(this));
        }
    },

    // never allow lastChild of a parent to be above the parent
    moveChildrenDown: function (nodes) {
        var column;
        var delta;
        var nextColumn;

        function moveChildren (node) {
            if (node.lastChild !== undefined) {
                delta = node.displayPosition - nextColumn[node.lastChild].displayPosition;

                if (delta > 0) {
                    // move down all children in column starting from node.firstChild
                    this.moveDisplayPositionsDown(nextColumn, node.firstChild, delta);
                }
            }
        }

        for (index = 1; index < nodes.length - 1; index += 1) {

            column = nodes[index];
            nextColumn = nodes[index + 1];

            column.forEach(moveChildren.bind(this));
        }
    },

    moveDisplayPositionsDown: function (column, startingIndex, delta) {
        var index;

        for (index = startingIndex; index < column.length; index += 1) {
            column[index].displayPosition += delta;
        }
    },

    // never allow firstChild of a parent to be below the parent
    moveChildrenUp: function (nodes) {
        var column;
        var delta;
        var nextColumn;

        function moveChildren (node) {
            if (node.firstChild !== undefined) {
                delta = node.displayPosition - nextColumn[node.firstChild].displayPosition;

                if (delta < 0) {
                    // move up all children in column starting from node.firstChild
                    this.moveDisplayPositionsUp(nextColumn, node.firstChild, delta);
                }
            }
        }

        for (index = 1; index < nodes.length - 1; index += 1) {

            column = nodes[index];
            nextColumn = nodes[index + 1];

            column.forEach(moveChildren.bind(this));
        }
    },

    moveDisplayPositionsUp: function (column, startingIndex, delta) {
        var index;

        for (index = startingIndex; index < column.length; index += 1) {
            column[index].displayPosition += delta;
        }
    },

    ensureAllChildrenAreContiguous: function (nodes) {
        var column;
        var delta;
        var nextColumn;

        function moveChildren (node) {
            var displayPosition;
            var indexChildren;

            if (node.firstChild !== undefined) {
                displayPosition = nextColumn[node.firstChild].displayPosition + 1;

                for (indexChildren = node.firstChild + 1; indexChildren <= node.lastChild; indexChildren += 1) {

                    if (nextColumn[indexChildren]) {
                        nextColumn[indexChildren].displayPosition = displayPosition;
                        displayPosition += 1;
                    }
                }
            }
        }

        for (index = 1; index < nodes.length - 1; index += 1) {
            column = nodes[index];
            nextColumn = nodes[index + 1];

            column.forEach(moveChildren.bind(this));
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
        var lengthOfLongestColumn = this.getLengthOfLongestColumn(nodes);

        nodes.forEach(function (column, columnIndex) {

            // create an array with an empty object for each value
            columnData = this.createArrayOfEmptyObjects(lengthOfLongestColumn);

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

    getLengthOfLongestColumn: function (nodes) {
        var lengthOfLongestColumn = 0;

        nodes.forEach(function (column) {
            lengthOfLongestColumn = Math.max(lengthOfLongestColumn, this.getLastPosition(column));
        }.bind(this));

        return lengthOfLongestColumn;
    },

    getLastPosition: function (column) {
        var lastPositionInColumn = 0;

        column.forEach(function (node) {
            if (node && node.displayPosition) {
                lastPositionInColumn = Math.max(lastPositionInColumn, node.displayPosition);
            }
        });

        return lastPositionInColumn;
    },

    addRelationshipIndicators: function (nodes) {
        var inBetweenMode;

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

    getNodeSnapShot: function (nodes) {
        var snapShotChecksum = 0;

        nodes.forEach(function (column) {
            column.forEach(function (node) {
                if (node && node.displayPosition) {
                    snapShotChecksum += node.displayPosition;
                }
            });
        });

        return snapShotChecksum;
    }
});


function debug (nodes, msg) {
    // todo: lots of hard coded values here that need to be dynamic
    var cell;
    var cells = [[], [], [], [], []];
    var indexColumn;
    var indexNode;
    var longestColumn = 14;
    var string;

    console.error(msg);

    for (indexColumn = 0; indexColumn < 5; indexColumn += 1) {

        for (indexNode = 0; indexNode < longestColumn; indexNode += 1) {
            cells[indexColumn][indexNode] = '          ';
        }
    }

    for (indexColumn = 0; indexColumn < 5; indexColumn += 1) {

        for (indexNode = 0; indexNode < longestColumn; indexNode += 1) {
            cell = nodes[indexColumn][indexNode];

            if (cell && cell.alternateName) {
                cells[indexColumn][cell.displayPosition] = cell.alternateName + ' ';
            }
        }
    }

    for (indexNode = 0; indexNode < longestColumn; indexNode += 1) {
        string = '';

        for (indexColumn = 0; indexColumn < 5; indexColumn += 1) {
            string += cells[indexColumn][indexNode];
        }
        console.error(string);
    }
}

module.exports = DependencyTree;
