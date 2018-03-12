

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var pointcloud;
var raycaster;
var mouse = new THREE.Vector2();
var intersection = null;
var clock;
var mouseDown;
var highlightMode = false;
var threshold = 0.1;
var pointSize = 0.5;
// data structures
var data;
var spheres = [];
var pointsWithSpheres = new Set();
var selectedPoints = [];
var boxMap = new Map();
var boundingBoxes = [];
var image_loaded = false;

init();
// animate();

// Should be in init?
var sphereGeometry, sphereMaterial;


function generatePointCloud( vertices, color ) {

    var geometry = new THREE.Geometry();

    var colors = [];

    var k = 0;

    for ( var i = 0, l = vertices.length; i < l; i ++ ) {

        // vertex = vertices[ i ];
        // creates new vector from a cluster and adds to geometry
        // var v = new THREE.Vector3( vertices[ 16 * k + 1 ], 
        //     vertices[ 16 * k + 2 ], vertices[ 16 * k ] );
        var v = new THREE.Vector3( vertices[ 16 * k + 1 ], 
            0, vertices[ 16 * k ] );
        geometry.vertices.push( v );

        var intensity = ( 1 ) * 7;
        colors[ k ] = ( color.clone().multiplyScalar( intensity ) );

        k++;
    }

    geometry.colors = colors;
    geometry.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: pointSize, vertexColors: THREE.VertexColors } );
    // creates pointcloud given vectors
    var pointcloud = new THREE.Points( geometry, material );

    return pointcloud;

}

// called first, populates scene and initializes renderer
function init() {

    var container = document.getElementById( 'container' );

    scene = new THREE.Scene();

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    // camera.position.y = 25;
    // camera.position.z = 37;
    camera.position.set(0, 100, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));
    // camera = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, 
    //                                     -window.innerHeight / 2, window.innerHeight / 2, 1, 100);
    // //

    sphereGeometry = new THREE.SphereGeometry( 0.1, 32, 32 );
    sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, shading: THREE.FlatShading } );

    //

    var grid = new THREE.GridHelper( 200, 20 );
    grid.setColors( 0xffffff, 0xffffff );
    scene.add( grid );

    //

    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    //

    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = threshold;

    //

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enabled = false;
    controls.maxPolarAngle = 0;
    controls.minPolarAngle = 0;
    // controls.maxAzimuthAngle = Math.PI;
    // controls.minAzimuthAngle = -Math.PI;
    //

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.getElementById( 'save' ).addEventListener( 'click', save, false );
    document.getElementById( 'export' ).addEventListener( 'click', save_image, false );
    document.getElementById( 'move' ).addEventListener( 'click', moveMode, false );
    document.getElementById( 'label' ).addEventListener( 'click', labelMode, false );
    document.getElementById( 'file_input' ).addEventListener( 'change', upload_file, false );
    document.getElementById( 'draw-box').addEventListener( 'click', drawBox, false );
    //
    // commented out lines below
    // initNav();
    // show(document.getElementById('obj'0), Object.keys(data)[0]);
    // show();
    // var dragControls = new THREE.DragControls( boxes, camera, renderer.domElement );
    // dragControls.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
    // dragControls.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );
}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function onDocumentMouseUp( event ) {

    event.preventDefault();
    mouseDown = false;

}

function onDocumentMouseDown( event ) {

    event.preventDefault();
    mouseDown = true;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

var toggle = 0;

function render() {

    raycaster.setFromCamera( mouse, camera );

    var intersections = raycaster.intersectObjects( [pointcloud] );
    intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;
    // if point is clicked on, color with red sphere
    if ( toggle > 0.005 && intersection !== null && !(
            pointsWithSpheres.has(intersection.index)) && mouseDown
            && !controls.enabled) {
        // console.log(intersection);
        var point = pointcloud.geometry.vertices[intersection.index];
        var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        sphere.position.copy( point );
        scene.add(sphere);
        spheres.push(sphere);
        pointsWithSpheres.add(intersection.index);
        selectedPoints.push(point);
        toggle = 0;
    }

    toggle += clock.getDelta();

    renderer.render( scene, camera );

}


// Navigation Bar

function initNav() {
    navigation = document.getElementById('navigation');
    var i = 0;
    for (key in data) {
        var li = document.createElement('li');
        var element = document.createElement('a');
        li.appendChild(element);
        element.innerHTML = i + 1;
        element.id = 'obj' + i;
        wrapper = function(key) { return function() { show(this, key); }}
        element.onclick = wrapper(key);
        navigation.appendChild(li);
        i += 1;
    }
}
 
// self-explanatory
function clearNav() {
    for (var i = 0; i < Object.keys(data).length; i++) {
        document.getElementById('obj' + i).className = '';
    }
}

function show() {
    // clearNav();
    // button.className += "selected";
    var rotation = 0;

    if (pointcloud !== undefined) {
        scene.remove(pointcloud);
        rotation = pointcloud.rotation.y;
    }
    // add pointcloud to scene
    pointcloud = generatePointCloudForCluster();
    // console.log(pointcloud);
    pointcloud.rotation.y = rotation;
    scene.add( pointcloud );

    // var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    // var material = new THREE.MeshDepthMaterial( {opacity: .1} );
    // var cube = new THREE.Mesh( geometry, material );
    // boxes.push(cube);
    // scene.add( cube );

}

function generatePointCloudForCluster() {
    return generatePointCloud(data, new THREE.Color( 0,1,0 ));
}

function moveMode( event ) {
    event.preventDefault();
    controls.enabled = true;
    document.getElementById( 'label' ).className = "";
    document.getElementById( 'move' ).className = "selected";
}

function labelMode( event ) {
    event.preventDefault();
    controls.enabled = false;
    document.getElementById( 'label' ).className = "selected";
    document.getElementById( 'move' ).className = "";
}

function save() {
    textContents = [];
    var numHighlighted = 0
    for (var i=0;i<pointcloud.geometry.vertices.length;i++) {
        var point = pointcloud.geometry.vertices[i];
        var highlighted = pointsWithSpheres.has(i) ? 1 : 0;
        numHighlighted += highlighted;
        string = "%f,%f,%f,%d\n".format(point.x, point.y, point.z, highlighted);
        textContents.push(string);
    }
    console.log('Number of highlighted points: ' + numHighlighted.toString());
    var blob = new Blob(textContents, {type: "text/plain;charset=utf-8"});
    saveAs(blob, "labelled.csv");
}

function save_image() {
    renderer.domElement.toBlob(function (blob) {
        saveAs(blob, "image.png");
    });
}

function upload_file() {
    var x = document.getElementById("file_input");
    if (x.files.length > 0) {
        var file = x.files[0];
        load_text_file(file, import_annotations_from_bin);
    }
}

function import_annotations_from_bin(data) {
  if ( data === '' || typeof(data) === 'undefined') {
    return;
  }
}


function load_text_file(text_file, callback_function) {
  if (text_file) {
    var text_reader = new FileReader();
    text_reader.readAsArrayBuffer(text_file);
    text_reader.onload = readData;
    image_loaded = true;
  }
}

function readData(e) {
    var rawLog = this.result;
    // console.log(rawLog);
    var floatarr = new Float32Array(rawLog)
    
    data = floatarr;
    // console.log(data);
    // console.log(data.length);

    show();
    animate();
}


function drawBox() {    
    var boundingBox = new THREE.Box3();
    boundingBox.setFromPoints(selectedPoints);
    console.log(boundingBox);
    console.log(selectedPoints);
    var helper = new THREE.Box3Helper( boundingBox, 0xffff00 );
    boundingBoxes.push(boundingBox);
    boxMap.set(boundingBox, selectedPoints);
    selectedPoints = [];
    scene.add( helper );
}

// https://stackoverflow.com/a/15327425/4855984
String.prototype.format = function(){
    var a = this, b;
    for(b in arguments){
        a = a.replace(/%[a-z]/,arguments[b]);
    }
    return a; // Make chainable
};