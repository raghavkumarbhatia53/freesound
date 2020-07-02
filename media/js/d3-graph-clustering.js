function activateGraph (graph, clusterId=undefined) {
    var data = JSON.parse(graph);

    const NODE_R = 15;

    var elem = document.getElementById('graph');

    // Audio
    var audioPlayers = {};
    
    function play_sound_from_url(sound_id, url) {
        if (audioPlayers[sound_id] === undefined) {
            var player = new Audio()
            player.src = url;
            player.autoplay = true;
            audioPlayers[sound_id] = player;
        } else {
            audioPlayers[sound_id].play();
        }
        
    }

    function playSound(d) {
        try {
            play_sound_from_url(d.id, d.url);
        } catch (error) {
            console.log(error);
        }
    }

    function stopSound() {
        Object.keys(audioPlayers).forEach(function(key) {
            var player = audioPlayers[key]
            player.pause();
            player.currentTime = 0;
        });
    }

    function onNodeHover(node) {
        if (node) {
            elem.style.cursor = 'pointer';
            playSound(node);
        } else {
            elem.style.cursor = null;
            stopSound();
        }
        hoverNode = node || null;
    }

    var nodeById = new Map();
    var nodeByGroup = new Map();
    data.nodes.forEach(function (node) {
        nodeById.set(node.id, node);

        var nodesInGroup = nodeByGroup.get(node.group);
        if (nodesInGroup === undefined) {
            nodeByGroup.set(node.group, [node]);
        } else {
            nodeByGroup.set(node.group, [...nodesInGroup, node]);
        }
    });

    function imageLabel(node) {
        var html_label = '<div>'
        html_label += node.name + '<br>'
        html_label += node.tags + '<br>'
        html_label += '<img src="' + node.image_url + '"></img>'
        html_label += '</div>'
        return html_label
    }

    // cross-link node objects
    data.links.forEach(link => {
        const a = nodeById.get(link.source);
        const b = nodeById.get(link.target);
        !a.neighbors && (a.neighbors = []);
        !b.neighbors && (b.neighbors = []);
        a.neighbors.push(b);
        b.neighbors.push(a);
    
        !a.links && (a.links = []);
        !b.links && (b.links = []);
        a.links.push(link);
        b.links.push(link);
    });

    const highlightNodes = new Set();
    const highlightLinks = new Set();
    let hoverNode = null;

    function onNodeClick(node) {
        if (cntrlIsPressed) {
            addSoundToBookmark(node);
        } else {
            highlightNodes.clear();
            highlightLinks.clear();
            if (node) {
                highlightNodes.add(node);
                node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
                node.links.forEach(link => highlightLinks.add(link));
            }
            hoverNode = node || null;
            elem.style.cursor = node ? '-webkit-grab' : null;
        }
    }

    // remeber if ctrl key is pressed
    var cntrlIsPressed = false;
    bookmarkedSounds = [];

    $(document).keydown(function(event) {
        if (event.which == "17")
            cntrlIsPressed = true;
    });
    
    $(document).keyup(function(event) {
        if (event.which == "17")
            cntrlIsPressed = false;
    });

    function addSoundToBookmark(node) {
        if (!bookmarkedSounds.includes(node.id)) {
            var link_id = "bookmark-s-" + node.id;
            $("#h2").append('<div id="bookmark-s-' + node.id +'"><a target="_blank" href="' 
                + node.sound_page_url + '">' + node.name 
                + '</a><span class="close-bookmark"> ×</span><div>');
            bookmarkedSounds.push(node.id);
            $('#'+link_id).children('.close-bookmark').click(() => {deleteBookmark(node.id)})
        }
    }

    function deleteBookmark(sound_id) {
        $('#bookmark-s-'+sound_id).remove();
        for (var i = bookmarkedSounds.length - 1; i >= 0; i--) {
            if (bookmarkedSounds[i] === sound_id) {
                bookmarkedSounds.splice(i, 1);
            }
        }
    }

    function onclick() {
        highlightNodes.clear();
        highlightLinks.clear();
    }

    function onClickClusterFacet(clusterId) {
        highlightNodes.clear();
        highlightLinks.clear();
        nodeByGroup.get(parseInt(clusterId)).forEach(neighbor => highlightNodes.add(neighbor));
    }

    // Add event when clicking on facet cluster
    $('.cluster-link-button').click(function () {
        var clusterId = $(this).attr('cluster-id');
        onClickClusterFacet(clusterId);
    });

    function drawBigNode(node, ctx) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgb(160,160,160)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color
        ctx.fill();
    }

    function drawSmallNode(node, ctx) {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    var width = elem.parentElement.getBoundingClientRect().width;
    var height = elem.parentElement.getBoundingClientRect().height;

    var Graph = ForceGraph()(elem);
    Graph.backgroundColor('rgba(128, 128, 128, 0.0)')
        .width(width)
        .height(height)
        .nodeRelSize(NODE_R)
        .nodeCanvasObject((node, ctx) => {
            drawSmallNode(node, ctx);
        })
        .nodeLabel(node => imageLabel(node))
        .nodeAutoColorBy('group')
        .linkColor(link => highlightLinks.has(link) ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)')
        .linkWidth(link => highlightLinks.has(link) ? 3 : 1)
        .onBackgroundClick(() => onclick())
        .onNodeHover(node => onNodeHover(node))
        .onNodeClick(node => {
            onNodeClick(node);
        })
        .nodeCanvasObjectMode(node => 'before')
        .nodeCanvasObject((node, ctx) => {
            drawSmallNode(node, ctx);
            if (hoverNode === node) {
                drawBigNode(node, ctx);
            }
            if (highlightNodes.size > 0) {
                if (highlightNodes.has(node)) {
                    drawBigNode(node, ctx);
                } else {
                    ctx.globalAlpha = 0.4;
                }
            }
        })

    var nodes = data.nodes;
    Graph
        .d3Force('collide', d3.forceCollide(Graph.nodeRelSize()*1.3))
        .d3Force('box', () => {
        const SQUARE_HALF_SIDE = Graph.nodeRelSize() * 800 * 0.5;
        nodes.forEach(node => {
            const x = node.x || 1, y = node.y || 1;
            // bounce on box walls
            if (Math.abs(x) > SQUARE_HALF_SIDE) { node.vx *= 0; }
            if (Math.abs(y) > SQUARE_HALF_SIDE) { node.vy *= 0; }
        });
        })
        .zoom(1)
        .graphData(data)
        .enableNodeDrag(false)
        .warmupTicks(300)
        .cooldownTicks(0)
        .onEngineStop(() => $('#graph-loader').hide());

    if (clusterId !== undefined) {
        onClickClusterFacet(clusterId);
    }
}
