THREE.Matrix3=function(){this.m=[]};THREE.Matrix3.prototype={constructor:THREE.Matrix3,transpose:function(){var b,a=this.m;b=a[1];a[1]=a[3];a[3]=b;b=a[2];a[2]=a[6];a[6]=b;b=a[5];a[5]=a[7];a[7]=b;return this},transposeIntoArray:function(b){var a=this.m;b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return this}};