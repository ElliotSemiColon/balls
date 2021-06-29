var canvas = document.getElementById("canvas"); 
var ctx = canvas.getContext("2d"); 
window.addEventListener('resize', resizeCanvas, false);

let maxDistSquare = 100000000;

resizeCanvas();

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    maxDistSquare = (canvas.width * canvas.width) + (canvas.height * canvas.height);
}

let mouseX, mouseY;

document.onmousemove = getMouse;

function getMouse(event){

    mouseX = event.clientX;
    mouseY = event.clientY;
}

let planets = [], mass, radius, noPlanets = 25, initialVMax = 1, frameID = 0;

for(let i = 0; i < noPlanets; i++){

    mass = (Math.random() * 1000) + 1;
    //mass = 100;
    radius = Math.pow(mass, 1/2) * 3;

    planets.push({
        id: i,
        x: radius + Math.random() * (canvas.width - radius * 2),
        y: radius + Math.random() * (canvas.height - radius * 2),
        vi: (Math.random() * initialVMax * 2) - initialVMax,
        vj: (Math.random() * initialVMax * 2) - initialVMax,
        ai: 0,
        aj: 0,
        mass: mass,
        radius: radius,
        digits: Math.ceil(Math.log10(Math.round(mass) + 1)), //digits in mass number
        opacity: 0.1
    });

}

let a, dt, prevTime, steps = 100, sdt, planet;
const G = 1; //gravitational constant

function update(p){ //moves planet p based on acceleration

    //p.aj += 0.000981 * sdt / 16;

    // p.ai -= 0.0002 * p.vi;
    // p.aj -= 0.0002 * p.vj;

    p.vi += p.ai * sdt / 16;
    p.vj += p.aj * sdt / 16;

    p.x += p.vi * sdt / 16;
    p.y += p.vj * sdt / 16;

    if(p.x > canvas.width - p.radius){ 
        p.vi *= -1;
        p.x = canvas.width - p.radius;
    }
    if(p.x < p.radius){ 
        p.vi *= -1;
        p.x = p.radius;
    }

    if(p.y > canvas.height - p.radius){ 
        p.vj *= -1;
        p.y = canvas.height - p.radius;
    }
    if(p.y < p.radius){ 
        p.vj *= -1;
        p.y = p.radius;
    }

}

function draw(p){ //draws planet p

    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
    //ctx.stroke(); 
    ctx.fill();

    p.opacity += (0.1 - p.opacity)/25;
    //p.opacity *= 0.99;

}

//static 
function staticCollide(planet){

    let dx, dy, squareDist, dist, overlap, dynamicDat;

    planets.forEach(target => { 
        if(planet != target){
            dx = target.x - planet.x;
            dy = target.y - planet.y;
            squareDist = (dx * dx) + (dy * dy);

            if(squareDist < (planet.radius + target.radius) * (planet.radius + target.radius)){
                
                planet.opacity = target.opacity = 0.5;
                //console.log("collide");

                dist = Math.sqrt(squareDist);
                overlap = 0.5 * ((planet.radius + target.radius) - dist);

                //move planet half the overlap away from the other planet
                planet.x -= overlap * dx / dist;
                planet.y -= overlap * dy / dist;

                //move the other planet in the same way
                target.x += overlap * dx / dist;
                target.y += overlap * dy / dist;

            }
        }
    });
}

function dynamicCollide(planet){

    let dx, dy, dist;

    planets.forEach(target => { 
        if(planet != target){
            dx = target.x - planet.x;
            dy = target.y - planet.y;
            dist = Math.sqrt((dx * dx) + (dy * dy));

            if(dist < planet.radius + target.radius){
                let nx = (target.x - planet.x) / dist; //normalised normal vect
                let ny = (target.y - planet.y) / dist;

                let tx = -ny; //tangential vector
                let ty = nx;

                // dot product for tangent (multiply each row of two column vectors and add the products up)
                let dpTan1 = (planet.vi * tx) + (planet.vj * ty);
                let dpTan2 = (target.vi * tx) + (target.vj * ty);
                // (i.e. how much of the balls' velocity gets transferred to the tangent)

                // dot product normal
                let dpNorm1 = (planet.vi * nx) + (planet.vj * ny);
                let dpNorm2 = (target.vi * nx) + (target.vj * ny);

                // conservation of momentum in 1D
                let m1 = (dpNorm1 * (planet.mass - target.mass) + (2 * target.mass * dpNorm2)) / (planet.mass + target.mass);
                let m2 = (dpNorm2 * (target.mass - planet.mass) + (2 * planet.mass * dpNorm1)) / (planet.mass + target.mass);

                planet.vi = tx * dpTan1 + (nx * m1);
                planet.vj = ty * dpTan1 + (ny * m1);
                target.vi = tx * dpTan2 + (nx * m2);
                target.vj = ty * dpTan2 + (ny * m2);
                //console.log(planet, target);
            }
        }
    });
}

function connect(frameID){ //completely visual graph looking thing

    let distSquared, opacity, k = 0;

    // 0.5(n^2 - n) complexity rather than n^2 (this is the mimumum number of loops you can do to connect every object to every other object)
    // therefore it only loops for the number of lines on the screen
    ctx.font = "30px Arial";
    for(let i = 0; i < planets.length; i++){

        for(let j = i + 1; j < planets.length; j++){

            distSquared = (planets[j].x - planets[i].x) * (planets[j].x - planets[i].x) + (planets[j].y - planets[i].y) * (planets[j].y - planets[i].y);
            opacity = 1 - (distSquared / maxDistSquare);
            opacity = Math.pow(opacity, 32);

            ctx.lineWidth = opacity * 3;
            ctx.strokeStyle = `rgba(${(127.5 * Math.sin((frameID/100 + k))) + 127.5},${(127.5 * Math.sin((frameID/100 + k) + Math.PI/1.5)) + 127.5},${(127.5 * Math.sin((frameID/100 + k) + Math.PI/0.75)) + 127.5},${opacity})`;
            // debug ctx.strokeStyle = `rgba(${(127.5 * Math.sin(k)) + 127.5},${(127.5 * Math.sin(k + Math.PI/1.5)) + 127.5},${(127.5 * Math.sin(k + Math.PI/0.75)) + 127.5},${opacity})`;
            ctx.beginPath();
            ctx.moveTo(planets[i].x, planets[i].y);
            ctx.lineTo(planets[j].x, planets[j].y);
            ctx.stroke();
        }

        k += (1/noPlanets);
    }
}

function mainLoop(timestamp){

    ctx.fillStyle = "rgba(0,5,30)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    dt = timestamp - prevTime;
    prevTime = timestamp;

    sdt = dt / steps; //sub-timesteps

    if(sdt){
        for(let x = 0; x < steps; x++){ //physics steps per frame
            planets.forEach(planet => {
                staticCollide(planet);
                dynamicCollide(planet);
                update(planet);
            });
        }
 /*
        //collision
        planets.forEach(planet => {
            planet = Collide(planet);
        });*/
    }

    connect(frameID); //fancy looking lines drawn between planets
    for(let j = 0; j < planets.length; j++){ draw(planets[j]); }

    frameID++;
    requestAnimationFrame(mainLoop);
}

mainLoop();