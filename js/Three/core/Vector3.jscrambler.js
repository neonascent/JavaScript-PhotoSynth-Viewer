THREE.Vector3=function(a,b,c){this.x=a||0;this.y=b||0;this.z=c||0};THREE.Vector3.prototype={constructor:THREE.Vector3,set:function(a,b,c){this.x=a;this.y=b;this.z=c;return this},copy:function(a){this.x=a.x;this.y=a.y;this.z=a.z;return this},clone:function(){return new THREE.Vector3(this.x,this.y,this.z)},add:function(a,b){this.x=a.x+b.x;this.y=a.y+b.y;this.z=a.z+b.z;return this},addSelf:function(a){this.x+=a.x;this.y+=a.y;this.z+=a.z;return this},addScalar:function(a){this.x+=a;this.y+=a;this.z+=a;return this},sub:function(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this},subSelf:function(a){this.x-=a.x;this.y-=a.y;this.z-=a.z;return this},multiply:function(a,b){this.x=a.x*b.x;this.y=a.y*b.y;this.z=a.z*b.z;return this},multiplySelf:function(a){this.x*=a.x;this.y*=a.y;this.z*=a.z;return this},multiplyScalar:function(a){this.x*=a;this.y*=a;this.z*=a;return this},divideSelf:function(a){this.x/=a.x;this.y/=a.y;this.z/=a.z;return this},divideScalar:function(a){if(a){this.x/=a;this.y/=a;this.z/=a}else{this.set(0,0,0)}return this},negate:function(){return this.multiplyScalar(-1)},dot:function(a){return this.x*a.x+this.y*a.y+this.z*a.z},lengthSq:function(){return this.x*this.x+this.y*this.y+this.z*this.z},length:function(){return Math.sqrt(this.lengthSq())},lengthManhattan:function(){return this.x+this.y+this.z},normalize:function(){return this.divideScalar(this.length())},setLength:function(a){return this.normalize().multiplyScalar(a)},cross:function(a,b){this.x=a.y*b.z-a.z*b.y;this.y=a.z*b.x-a.x*b.z;this.z=a.x*b.y-a.y*b.x;return this},crossSelf:function(a){return this.set(this.y*a.z-this.z*a.y,this.z*a.x-this.x*a.z,this.x*a.y-this.y*a.x)},distanceTo:function(a){return Math.sqrt(this.distanceToSquared(a))},distanceToSquared:function(a){return new THREE.Vector3().sub(this,a).lengthSq()},setPositionFromMatrix:function(a){this.x=a.n14;this.y=a.n24;this.z=a.n34},setRotationFromMatrix:function(a){var b=Math.cos(this.y);this.y=Math.asin(a.n13);if(Math.abs(b)>0.00001){this.x=Math.atan2(-a.n23/b,a.n33/b);this.z=Math.atan2(-a.n12/b,a.n11/b)}else{this.x=0;this.z=Math.atan2(a.n21,a.n22)}},isZero:function(){return (this.lengthSq()<0.0001)}};