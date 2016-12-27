var _ = require('lodash');
var classNames = require('classnames');
var React = require('react');
var ReactDependencyNode = require('./react-dependency-node');


var ReactDependencyTree = React.createClass({

    propTypes: {
        items: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                applicable: React.PropTypes.bool,
                dark: React.PropTypes.bool,
                data: React.PropTypes.object,
                displayableChildren: React.PropTypes.bool,
                items: React.PropTypes.array.isRequired,
                bright: React.PropTypes.bool,
                name: React.PropTypes.string.isRequired,
                nodeType: React.PropTypes.string
            })
        ).isRequired,
        filterDuplicates: React.PropTypes.bool,
        renderNodeCallback: React.PropTypes.func.isRequired
    },

    getDefaultProps: function () {
        return {
            filterDuplicates: false
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
            <div className="react-dependency-tree">
                {this.state.nodes.map(this.renderColumn)}
            </div>
        );
    },

    renderColumn: function (column, index) {
        return (
            <ul className="react-dependency-tree--column" key={index}>
                {column.map(this.renderDetail)}
            </ul>
        );
    },

    renderDetail: function (item, index) {
        return (
            <li key={index}>
                <ReactDependencyNode {...this.getNodeProps(item, index)} />
            </li>
        );
    },

    getNodeProps: function (item, index) {
        var connectionProps = this.getConnections(item, index);
        var props = {
            dark: item.dark,
            item: item,
            bright: item.bright,
            renderNodeCallback: this.props.renderNodeCallback
        };

        return _.extend(props, connectionProps);
    },

    getConnections: function (item, index) {
        var parent = item.parent;
        var syblingAbove = (parent !== undefined && parent.firstChild !== parent.lastChild && parent.firstChild !== index);
        var syblingBelow = (parent !== undefined && parent.firstChild !== parent.lastChild && parent.lastChild !== index);

        return {
            child: (parent !== 0 && parent !== undefined),
            parent: (item.firstChild !== undefined),
            passThru: item.inBetween,
            syblingAbove: syblingAbove,
            syblingBelow: syblingBelow
        };
    },

    initializeState: function (props) {
        return {
            nodes: this.prepareAllData(props.items)
        };
    },

    prepareAllData: function (allNodes) {
        var nodes = allNodes;
        var lastSnapShotChecksum;
        var refining = 1;
        var snapShotChecksum;

        if (this.props.filterDuplicates) {
            nodes = this.filterAllDuplicates(nodes);
        }

        nodes = this.getNodeColumns(nodes);
        this.getParents(nodes);
        this.addChildPositions(nodes);

        lastSnapShotChecksum = this.getNodeSnapShot(nodes);

        while (refining && refining < 20) {
            this.RepositionNodesForBestPlacement(nodes);

            snapShotChecksum = this.getNodeSnapShot(nodes);

            if (lastSnapShotChecksum !== snapShotChecksum) {
                lastSnapShotChecksum = snapShotChecksum;
                refining += 1;
            } else {
                refining = 0; // no changes made, so we're done
            }
        }

        this.updateChildIndexFromChildDisplayPositions(nodes);
        this.fillInBlankCells(nodes);
        this.addRelationshipIndicators(nodes);

        return nodes;
    },

    filterAllDuplicates: function (allNodes) {
        var filteredNodes = [];

        allNodes.forEach(function (node) {
            filteredNodes.push(this.filterDuplicates(node, {}));
        }.bind(this));

        return filteredNodes;
    },

    filterDuplicates: function (originalNode, filteredNode, nodesProcessed) {
        if (nodesProcessed === undefined) {
            nodesProcessed = [];

            filteredNode.applicable = originalNode.applicable;
            filteredNode.dark = originalNode.dark;
            filteredNode.data = _.cloneDeep(originalNode.data);
            filteredNode.displayableChildren = originalNode.displayableChildren;
            filteredNode.items = [];
            filteredNode.bright = originalNode.bright;
            filteredNode.name = originalNode.name;
            filteredNode.nodeType = originalNode.nodeType;
        }
        nodesProcessed.push(filteredNode.name);

        // TODO this isn't foolproof - two identical names are possible
        originalNode.items.forEach(function (childNode) {
            var node = {
                applicable: childNode.applicable,
                dark: childNode.dark,
                data: _.cloneDeep(childNode.data),
                displayableChildren: childNode.displayableChildren,
                items: [],
                bright: childNode.bright,
                name: childNode.name,
                nodeType: childNode.nodeType,
            };

            filteredNode.items.push(node);

            if (_.indexOf(nodesProcessed, childNode.name) === -1) {
                if (childNode.items.length) {
                    this.filterDuplicates(childNode, node, nodesProcessed);
                } else {
                    nodesProcessed.push(node.name);
                }
            } else {
                node.dark = true;
            }
        }, this);


        return filteredNode;
    },

    getNodeColumns: function (rawNodes) {
        var nodes = [[]];

        rawNodes.forEach(function (node) {
            nodes[0].push({
                applicable: node.applicable,
                dark: node.dark,
                data: _.cloneDeep(node.data),
                displayableChildren: node.displayableChildren,
                displayPosition: nodes[0].length,
                bright: node.bright,
                name: node.name,
                nodeType: node.nodeType,
                parent: 0
            });

            nodes = this.buildNodeColumns(node, 1, nodes[0].length - 1, nodes);
        }.bind(this));

        return nodes;
    },

    buildNodeColumns: function (node, level, parentIndex, nodes) {
        node.items.forEach(function (childNode) {

            if (!nodes[level]) {
                nodes[level] = [];
            }

            nodes[level].push({
                applicable: childNode.applicable,
                dark: childNode.dark,
                data: _.cloneDeep(childNode.data),
                displayableChildren: childNode.displayableChildren,
                displayPosition: nodes[level].length,
                bright: childNode.bright,
                name: childNode.name,
                nodeType: childNode.nodeType,
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

    // initialize for each parent an element for firstChild and lastChild
    addChildPositions: function (nodes) {
        var parentName;

        nodes.forEach(function (column, columnIndex) {

            if (columnIndex > 0) {

                parentName = '';
                column.forEach(function (childNode, index) {

                    if (parentName.length === 0) {
                        parentName = childNode.parent.name;
                        childNode.parent.firstChild = index;
                    }

                    if (childNode.parent.name !== parentName) {
                        childNode.parent.firstChild = index;
                        childNode.parent.lastChild = index;
                        parentName = childNode.parent.name;
                    } else {
                        if (childNode.parent.firstChild === undefined) {
                            childNode.parent.firstChild = index;
                        }
                        childNode.parent.lastChild = index;
                    }
                }, this);
            }
        });
    },

    RepositionNodesForBestPlacement: function (nodes) {
        var currentColumn;
        var delta;
        var index;
        var nextColumn;

        function getDesiredDisplayPosition (node, nextColumn) {
            var displayPosition;
            var firstChildNode = nextColumn[node.firstChild];
            var lastChildNode = nextColumn[node.lastChild];
            var middle = (lastChildNode.displayPosition - firstChildNode.displayPosition) / 2;

            displayPosition = firstChildNode.displayPosition + Math.floor(middle);

            return displayPosition;
        }

        function moveParentAndLowerSyblingsDown (column, startingIndex, delta) {
            moveDisplayPositionsDown(column, startingIndex, delta);
        }

        function moveChildrenAndLowerSyblingsDown (column, startingIndex, delta) {
            moveDisplayPositionsDown(column, startingIndex, delta);
        }

        function moveDisplayPositionsDown (column, startingIndex, delta) {
            var index;

            for (index = startingIndex; index < column.length; index = index + 1) {
                column[index].displayPosition = column[index].displayPosition + delta;
            }
        }

        for (index = 0; index < nodes.length - 1; index = index + 1) {

            currentColumn = nodes[index];
            nextColumn = nodes[index + 1];

            currentColumn.forEach(function (node, nodeIndex) {

                if (node.firstChild !== undefined) {
                    displayPosition = getDesiredDisplayPosition(node, nextColumn);

                    if (displayPosition > node.displayPosition) {
                        delta = displayPosition - node.displayPosition;
                        moveParentAndLowerSyblingsDown(currentColumn, nodeIndex, delta);
                    } else if (displayPosition < node.displayPosition) {
                        delta = node.displayPosition - displayPosition;
                        moveChildrenAndLowerSyblingsDown(nextColumn, node.firstChild, delta);
                    }
                }
            });
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
                if (node.displayPosition !== undefined) {
                    columnData[node.displayPosition] = node;
                }
            });

            nodes[columnIndex] = columnData;
        }, this);
    },

    createArrayOfEmptyObjects: function (numberOfArrayItemsToCreate) {
        var arrayOfEmptyObjects = [];
        var loopIndex;

        for (loopIndex = numberOfArrayItemsToCreate; loopIndex > 0; loopIndex = loopIndex - 1) {
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

            if (columnIndex > 0 && columnIndex < nodes.length) {

                inBetweenMode = false;
                column.forEach(function (childNode, index) {

                    if (childNode.parent && childNode.parent.firstChild === index) {
                        inBetweenMode = true;
                    }

                    if (inBetweenMode) {

                        if (!childNode.name) {
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


module.exports = ReactDependencyTree;
