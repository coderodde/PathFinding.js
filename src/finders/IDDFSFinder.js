var Heap       = require('heap');
var Util       = require('../core/Util');
var DiagonalMovement = require('../core/DiagonalMovement');

/**
 * IDDFS (iterative deepening depth-first search) path-finder.
 * Based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {Object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 *     Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching 
 *     block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {number} opt.weight Weight to apply to the heuristic to allow for
 *     suboptimal paths, in order to speed up the search.
 */
function IDDFSFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
    this.diagonalMovement = opt.diagonalMovement;

    if (!this.diagonalMovement) {
        if (!this.allowDiagonal) {
            this.diagonalMovement = DiagonalMovement.Never;
        } else {
            if (this.dontCrossCorners) {
                this.diagonalMovement = DiagonalMovement.OnlyWhenNoObstacles;
            } else {
                this.diagonalMovement = DiagonalMovement.IfAtMostOneObstacle;
            }
        }
    }

    // When diagonal movement is allowed the manhattan heuristic is not
    //admissible. It should be octile instead
    if (this.diagonalMovement === DiagonalMovement.Never) {
        this.heuristic = opt.heuristic || Heuristic.manhattan;
    } else {
        this.heuristic = opt.heuristic || Heuristic.octile;
    }
}

/**
 * Makes an actional deepening further.
 */
function depthLimitedSearch(state,
                            node, 
                            target, 
                            visitedSet, 
                            grid,
                            depth) {
                              
    if (depth === 0) {
        node.opened = true;
        
        if (node === target) {
            state[0] = true;
            state[1].push(target);
            return;
        }
    }
    
    const nodeKey = "[x = " + node.x + ", y = " + node.y + "]";
    
    if (visitedSet[nodeKey]) {
        return;
    }
    
    visitedSet[nodeKey] = true;
    node.closed = true;
    
    if (depth > 0) {
        const neighbors = grid.getNeighbors(node, diagonalMovement);
        
        for (const neighbor of neigbours) {
            if (state[0]) {
                return;
            }
          
            const neighborKey = "[x = " + node.x + ", y = " + node.y + "]";
            
            if (visitedSet[neighborKey]) {
                continue;
            }
            
            depthLimitedSearch(state,
                               neighbor,
                               target,
                               visitedSet,
                               grid,
                               depth - 1);
                               
//            neighbor.closed = true;
//            neighbor.opened = false;
        }
    }
}

/**
 * Find and return the the path.
 * @return {Array<Array<number>>} The path, including both start and
 *     end positions.
 */
IDDFSFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        heuristic = this.heuristic,
        diagonalMovement = this.diagonalMovement,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, ng;

    startNode.opened = true;
    
    const path = [];
    const visitedSet = {};
    var previousVisitedSetSize = 0;
    // state[0] is a boolean flag indicating that a path was found.
    // state[1] is a current path candidate.
    const state = [false, []];
    
    // keep descending
    for (var depth = 0;; ++depth) {
      
        depthLimitedSearch(state, 
                           startNode, 
                           endNode,
                           visitedSet,
                           grid,
                           depth);
        
        if (state[0]) {
            return  state[1].reverse();
        }
        
        const visitedSetSize = Object.keys(visitedSet).length;
        
        if (previousVisitedSetSize === visitedSetSize) {
            return [];
        }
        
        previousVisitedSetSize = visitedSetSize;
        visitedSet = {};
        state[1].clear();
    }
};

module.exports = IDDFSFinder;
