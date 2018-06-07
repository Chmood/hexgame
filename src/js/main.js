/*global HEXLIB,BABYLON,noise*/
////////////////////////////////////////////////////////////////////////////////
// HEXMAP A-STAR PATHFINDING
////////////////////////////////////////////////////////////////////////////////

// const shadeBlend = require('./vendor/shadeblend.js')
// const HEXLIB = require('./vendor/hexlib.js')
// const BABYLON = require('babylonjs')
import * as shadeBlend from './vendor/shadeblend.js'
import * as HEXLIB from './vendor/hexlib.js'
import BABYLON from 'babylonjs'
import noise from './vendor/noise.js'
console.warn('noise', noise)

// 'useless' image import
import img1 from "../img/TropicalSunnyDay_nx.jpg"
import img2 from "../img/TropicalSunnyDay_ny.jpg"
import img3 from "../img/TropicalSunnyDay_nz.jpg"
import img4 from "../img/TropicalSunnyDay_px.jpg"
import img5 from "../img/TropicalSunnyDay_py.jpg"
import img6 from "../img/TropicalSunnyDay_pz.jpg"
import waterbump from "../img/waterbump.png"

// import waterMaterial from './vendor/water-material.js'
// waterMaterial(BABYLON)

var __extends = (this && this.__extends) || (function () {
  var extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  return function (d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// var BABYLON;
(function (BABYLON) {
  var WaterMaterialDefines = /** @class */ (function (_super) {
      __extends(WaterMaterialDefines, _super);
      function WaterMaterialDefines() {
          var _this = _super.call(this) || this;
          _this.BUMP = false;
          _this.REFLECTION = false;
          _this.CLIPPLANE = false;
          _this.ALPHATEST = false;
          _this.DEPTHPREPASS = false;
          _this.POINTSIZE = false;
          _this.FOG = false;
          _this.NORMAL = false;
          _this.UV1 = false;
          _this.UV2 = false;
          _this.VERTEXCOLOR = false;
          _this.VERTEXALPHA = false;
          _this.NUM_BONE_INFLUENCERS = 0;
          _this.BonesPerMesh = 0;
          _this.INSTANCES = false;
          _this.SPECULARTERM = false;
          _this.LOGARITHMICDEPTH = false;
          _this.FRESNELSEPARATE = false;
          _this.BUMPSUPERIMPOSE = false;
          _this.BUMPAFFECTSREFLECTION = false;
          _this.rebuild();
          return _this;
      }
      return WaterMaterialDefines;
  }(BABYLON.MaterialDefines));
  var WaterMaterial = /** @class */ (function (_super) {
      __extends(WaterMaterial, _super);
      /**
      * Constructor
      */
      function WaterMaterial(name, scene, renderTargetSize) {
          if (renderTargetSize === void 0) { renderTargetSize = new BABYLON.Vector2(512, 512); }
          var _this = _super.call(this, name, scene) || this;
          _this.renderTargetSize = renderTargetSize;
          _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
          _this.specularColor = new BABYLON.Color3(0, 0, 0);
          _this.specularPower = 64;
          _this._disableLighting = false;
          _this._maxSimultaneousLights = 4;
          /**
          * @param {number}: Represents the wind force
          */
          _this.windForce = 6;
          /**
          * @param {Vector2}: The direction of the wind in the plane (X, Z)
          */
          _this.windDirection = new BABYLON.Vector2(0, 1);
          /**
          * @param {number}: Wave height, represents the height of the waves
          */
          _this.waveHeight = 0.4;
          /**
          * @param {number}: Bump height, represents the bump height related to the bump map
          */
          _this.bumpHeight = 0.4;
          /**
           * @param {boolean}: Add a smaller moving bump to less steady waves.
           */
          _this._bumpSuperimpose = false;
          /**
           * @param {boolean}: Color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
           */
          _this._fresnelSeparate = false;
          /**
           * @param {boolean}: bump Waves modify the reflection.
           */
          _this._bumpAffectsReflection = false;
          /**
          * @param {number}: The water color blended with the refraction (near)
          */
          _this.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6);
          /**
          * @param {number}: The blend factor related to the water color
          */
          _this.colorBlendFactor = 0.2;
          /**
           * @param {number}: The water color blended with the reflection (far)
           */
          _this.waterColor2 = new BABYLON.Color3(0.1, 0.1, 0.6);
          /**
           * @param {number}: The blend factor related to the water color (reflection, far)
           */
          _this.colorBlendFactor2 = 0.2;
          /**
          * @param {number}: Represents the maximum length of a wave
          */
          _this.waveLength = 0.1;
          /**
          * @param {number}: Defines the waves speed
          */
          _this.waveSpeed = 1.0;
          _this._renderTargets = new BABYLON.SmartArray(16);
          /*
          * Private members
          */
          _this._mesh = null;
          _this._reflectionTransform = BABYLON.Matrix.Zero();
          _this._lastTime = 0;
          _this._lastDeltaTime = 0;
          _this._createRenderTargets(scene, renderTargetSize);
          // Create render targets
          _this.getRenderTargetTextures = function () {
              _this._renderTargets.reset();
              _this._renderTargets.push(_this._reflectionRTT);
              _this._renderTargets.push(_this._refractionRTT);
              return _this._renderTargets;
          };
          return _this;
      }
      Object.defineProperty(WaterMaterial.prototype, "useLogarithmicDepth", {
          get: function () {
              return this._useLogarithmicDepth;
          },
          set: function (value) {
              this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
              this._markAllSubMeshesAsMiscDirty();
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(WaterMaterial.prototype, "refractionTexture", {
          // Get / Set
          get: function () {
              return this._refractionRTT;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(WaterMaterial.prototype, "reflectionTexture", {
          get: function () {
              return this._reflectionRTT;
          },
          enumerable: true,
          configurable: true
      });
      // Methods
      WaterMaterial.prototype.addToRenderList = function (node) {
          if (this._refractionRTT && this._refractionRTT.renderList) {
              this._refractionRTT.renderList.push(node);
          }
          if (this._reflectionRTT && this._reflectionRTT.renderList) {
              this._reflectionRTT.renderList.push(node);
          }
      };
      WaterMaterial.prototype.enableRenderTargets = function (enable) {
          var refreshRate = enable ? 1 : 0;
          if (this._refractionRTT) {
              this._refractionRTT.refreshRate = refreshRate;
          }
          if (this._reflectionRTT) {
              this._reflectionRTT.refreshRate = refreshRate;
          }
      };
      WaterMaterial.prototype.getRenderList = function () {
          return this._refractionRTT ? this._refractionRTT.renderList : [];
      };
      Object.defineProperty(WaterMaterial.prototype, "renderTargetsEnabled", {
          get: function () {
              return !(this._refractionRTT && this._refractionRTT.refreshRate === 0);
          },
          enumerable: true,
          configurable: true
      });
      WaterMaterial.prototype.needAlphaBlending = function () {
          return (this.alpha < 1.0);
      };
      WaterMaterial.prototype.needAlphaTesting = function () {
          return false;
      };
      WaterMaterial.prototype.getAlphaTestTexture = function () {
          return null;
      };
      WaterMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
          if (this.isFrozen) {
              if (this._wasPreviouslyReady && subMesh.effect) {
                  return true;
              }
          }
          if (!subMesh._materialDefines) {
              subMesh._materialDefines = new WaterMaterialDefines();
          }
          var defines = subMesh._materialDefines;
          var scene = this.getScene();
          if (!this.checkReadyOnEveryCall && subMesh.effect) {
              if (this._renderId === scene.getRenderId()) {
                  return true;
              }
          }
          var engine = scene.getEngine();
          // Textures
          if (defines._areTexturesDirty) {
              defines._needUVs = false;
              if (scene.texturesEnabled) {
                  if (this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                      if (!this.bumpTexture.isReady()) {
                          return false;
                      }
                      else {
                          defines._needUVs = true;
                          defines.BUMP = true;
                      }
                  }
                  if (BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                      defines.REFLECTION = true;
                  }
              }
          }
          BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);
          BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
          if (defines._areMiscDirty) {
              if (this._fresnelSeparate) {
                  defines.FRESNELSEPARATE = true;
              }
              if (this._bumpSuperimpose) {
                  defines.BUMPSUPERIMPOSE = true;
              }
              if (this._bumpAffectsReflection) {
                  defines.BUMPAFFECTSREFLECTION = true;
              }
          }
          // Lights
          defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
          // Attribs
          BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);
          // Configure this
          this._mesh = mesh;
          if (this._waitingRenderList) {
              for (var i = 0; i < this._waitingRenderList.length; i++) {
                  this.addToRenderList(scene.getNodeByID(this._waitingRenderList[i]));
              }
              this._waitingRenderList = null;
          }
          // Get correct effect      
          if (defines.isDirty) {
              defines.markAsProcessed();
              scene.resetCachedMaterial();
              // Fallbacks
              var fallbacks = new BABYLON.EffectFallbacks();
              if (defines.FOG) {
                  fallbacks.addFallback(1, "FOG");
              }
              if (defines.LOGARITHMICDEPTH) {
                  fallbacks.addFallback(0, "LOGARITHMICDEPTH");
              }
              BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);
              if (defines.NUM_BONE_INFLUENCERS > 0) {
                  fallbacks.addCPUSkinningFallback(0, mesh);
              }
              //Attributes
              var attribs = [BABYLON.VertexBuffer.PositionKind];
              if (defines.NORMAL) {
                  attribs.push(BABYLON.VertexBuffer.NormalKind);
              }
              if (defines.UV1) {
                  attribs.push(BABYLON.VertexBuffer.UVKind);
              }
              if (defines.UV2) {
                  attribs.push(BABYLON.VertexBuffer.UV2Kind);
              }
              if (defines.VERTEXCOLOR) {
                  attribs.push(BABYLON.VertexBuffer.ColorKind);
              }
              BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
              BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
              // Legacy browser patch
              var shaderName = "water";
              var join = defines.toString();
              var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                  "vFogInfos", "vFogColor", "pointSize",
                  "vNormalInfos",
                  "mBones",
                  "vClipPlane", "normalMatrix",
                  "logarithmicDepthConstant",
                  // Water
                  "worldReflectionViewProjection", "windDirection", "waveLength", "time", "windForce",
                  "cameraPosition", "bumpHeight", "waveHeight", "waterColor", "waterColor2", "colorBlendFactor", "colorBlendFactor2", "waveSpeed"
              ];
              var samplers = ["normalSampler",
                  // Water
                  "refractionSampler", "reflectionSampler"
              ];
              var uniformBuffers = new Array();
              BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                  uniformsNames: uniforms,
                  uniformBuffersNames: uniformBuffers,
                  samplers: samplers,
                  defines: defines,
                  maxSimultaneousLights: this.maxSimultaneousLights
              });
              subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                  attributes: attribs,
                  uniformsNames: uniforms,
                  uniformBuffersNames: uniformBuffers,
                  samplers: samplers,
                  defines: join,
                  fallbacks: fallbacks,
                  onCompiled: this.onCompiled,
                  onError: this.onError,
                  indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights }
              }, engine), defines);
          }
          if (!subMesh.effect || !subMesh.effect.isReady()) {
              return false;
          }
          this._renderId = scene.getRenderId();
          this._wasPreviouslyReady = true;
          return true;
      };
      WaterMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
          var scene = this.getScene();
          var defines = subMesh._materialDefines;
          if (!defines) {
              return;
          }
          var effect = subMesh.effect;
          if (!effect || !this._mesh) {
              return;
          }
          this._activeEffect = effect;
          // Matrices        
          this.bindOnlyWorldMatrix(world);
          this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
          // Bones
          BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
          if (this._mustRebind(scene, effect)) {
              // Textures        
              if (this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                  this._activeEffect.setTexture("normalSampler", this.bumpTexture);
                  this._activeEffect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                  this._activeEffect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
              }
              // Clip plane
              BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
              // Point size
              if (this.pointsCloud) {
                  this._activeEffect.setFloat("pointSize", this.pointSize);
              }
              BABYLON.MaterialHelper.BindEyePosition(effect, scene);
          }
          this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
          if (defines.SPECULARTERM) {
              this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
          }
          if (scene.lightsEnabled && !this.disableLighting) {
              BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
          }
          // View
          if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
              this._activeEffect.setMatrix("view", scene.getViewMatrix());
          }
          // Fog
          BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
          // Log. depth
          BABYLON.MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);
          // Water
          if (BABYLON.StandardMaterial.ReflectionTextureEnabled) {
              this._activeEffect.setTexture("refractionSampler", this._refractionRTT);
              this._activeEffect.setTexture("reflectionSampler", this._reflectionRTT);
          }
          var wrvp = this._mesh.getWorldMatrix().multiply(this._reflectionTransform).multiply(scene.getProjectionMatrix());
          // Add delta time. Prevent adding delta time if it hasn't changed.
          var deltaTime = scene.getEngine().getDeltaTime();
          if (deltaTime !== this._lastDeltaTime) {
              this._lastDeltaTime = deltaTime;
              this._lastTime += this._lastDeltaTime;
          }
          this._activeEffect.setMatrix("worldReflectionViewProjection", wrvp);
          this._activeEffect.setVector2("windDirection", this.windDirection);
          this._activeEffect.setFloat("waveLength", this.waveLength);
          this._activeEffect.setFloat("time", this._lastTime / 100000);
          this._activeEffect.setFloat("windForce", this.windForce);
          this._activeEffect.setFloat("waveHeight", this.waveHeight);
          this._activeEffect.setFloat("bumpHeight", this.bumpHeight);
          this._activeEffect.setColor4("waterColor", this.waterColor, 1.0);
          this._activeEffect.setFloat("colorBlendFactor", this.colorBlendFactor);
          this._activeEffect.setColor4("waterColor2", this.waterColor2, 1.0);
          this._activeEffect.setFloat("colorBlendFactor2", this.colorBlendFactor2);
          this._activeEffect.setFloat("waveSpeed", this.waveSpeed);
          this._afterBind(mesh, this._activeEffect);
      };
      WaterMaterial.prototype._createRenderTargets = function (scene, renderTargetSize) {
          var _this = this;
          // Render targets
          this._refractionRTT = new BABYLON.RenderTargetTexture(name + "_refraction", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
          this._refractionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
          this._refractionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
          this._refractionRTT.ignoreCameraViewport = true;
          this._reflectionRTT = new BABYLON.RenderTargetTexture(name + "_reflection", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
          this._reflectionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
          this._reflectionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
          this._reflectionRTT.ignoreCameraViewport = true;
          var isVisible;
          var clipPlane = null;
          var savedViewMatrix;
          var mirrorMatrix = BABYLON.Matrix.Zero();
          this._refractionRTT.onBeforeRender = function () {
              if (_this._mesh) {
                  isVisible = _this._mesh.isVisible;
                  _this._mesh.isVisible = false;
              }
              // Clip plane
              clipPlane = scene.clipPlane;
              var positiony = _this._mesh ? _this._mesh.position.y : 0.0;
              scene.clipPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, positiony + 0.05, 0), new BABYLON.Vector3(0, 1, 0));
          };
          this._refractionRTT.onAfterRender = function () {
              if (_this._mesh) {
                  _this._mesh.isVisible = isVisible;
              }
              // Clip plane 
              scene.clipPlane = clipPlane;
          };
          this._reflectionRTT.onBeforeRender = function () {
              if (_this._mesh) {
                  isVisible = _this._mesh.isVisible;
                  _this._mesh.isVisible = false;
              }
              // Clip plane
              clipPlane = scene.clipPlane;
              var positiony = _this._mesh ? _this._mesh.position.y : 0.0;
              scene.clipPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, positiony - 0.05, 0), new BABYLON.Vector3(0, -1, 0));
              // Transform
              BABYLON.Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);
              savedViewMatrix = scene.getViewMatrix();
              mirrorMatrix.multiplyToRef(savedViewMatrix, _this._reflectionTransform);
              scene.setTransformMatrix(_this._reflectionTransform, scene.getProjectionMatrix());
              scene.getEngine().cullBackFaces = false;
              scene._mirroredCameraPosition = BABYLON.Vector3.TransformCoordinates(scene.activeCamera.position, mirrorMatrix);
          };
          this._reflectionRTT.onAfterRender = function () {
              if (_this._mesh) {
                  _this._mesh.isVisible = isVisible;
              }
              // Clip plane
              scene.clipPlane = clipPlane;
              // Transform
              scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
              scene.getEngine().cullBackFaces = true;
              scene._mirroredCameraPosition = null;
          };
      };
      WaterMaterial.prototype.getAnimatables = function () {
          var results = [];
          if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
              results.push(this.bumpTexture);
          }
          if (this._reflectionRTT && this._reflectionRTT.animations && this._reflectionRTT.animations.length > 0) {
              results.push(this._reflectionRTT);
          }
          if (this._refractionRTT && this._refractionRTT.animations && this._refractionRTT.animations.length > 0) {
              results.push(this._refractionRTT);
          }
          return results;
      };
      WaterMaterial.prototype.getActiveTextures = function () {
          var activeTextures = _super.prototype.getActiveTextures.call(this);
          if (this._bumpTexture) {
              activeTextures.push(this._bumpTexture);
          }
          return activeTextures;
      };
      WaterMaterial.prototype.hasTexture = function (texture) {
          if (_super.prototype.hasTexture.call(this, texture)) {
              return true;
          }
          if (this._bumpTexture === texture) {
              return true;
          }
          return false;
      };
      WaterMaterial.prototype.dispose = function (forceDisposeEffect) {
          if (this.bumpTexture) {
              this.bumpTexture.dispose();
          }
          var index = this.getScene().customRenderTargets.indexOf(this._refractionRTT);
          if (index != -1) {
              this.getScene().customRenderTargets.splice(index, 1);
          }
          index = -1;
          index = this.getScene().customRenderTargets.indexOf(this._reflectionRTT);
          if (index != -1) {
              this.getScene().customRenderTargets.splice(index, 1);
          }
          if (this._reflectionRTT) {
              this._reflectionRTT.dispose();
          }
          if (this._refractionRTT) {
              this._refractionRTT.dispose();
          }
          _super.prototype.dispose.call(this, forceDisposeEffect);
      };
      WaterMaterial.prototype.clone = function (name) {
          var _this = this;
          return BABYLON.SerializationHelper.Clone(function () { return new WaterMaterial(name, _this.getScene()); }, this);
      };
      WaterMaterial.prototype.serialize = function () {
          var serializationObject = BABYLON.SerializationHelper.Serialize(this);
          serializationObject.customType = "BABYLON.WaterMaterial";
          serializationObject.renderList = [];
          if (this._refractionRTT && this._refractionRTT.renderList) {
              for (var i = 0; i < this._refractionRTT.renderList.length; i++) {
                  serializationObject.renderList.push(this._refractionRTT.renderList[i].id);
              }
          }
          return serializationObject;
      };
      WaterMaterial.prototype.getClassName = function () {
          return "WaterMaterial";
      };
      // Statics
      WaterMaterial.Parse = function (source, scene, rootUrl) {
          var mat = BABYLON.SerializationHelper.Parse(function () { return new WaterMaterial(source.name, scene); }, source, scene, rootUrl);
          mat._waitingRenderList = source.renderList;
          return mat;
      };
      WaterMaterial.CreateDefaultMesh = function (name, scene) {
          var mesh = BABYLON.Mesh.CreateGround(name, 512, 512, 32, scene, false);
          return mesh;
      };
      __decorate([
          BABYLON.serializeAsTexture("bumpTexture")
      ], WaterMaterial.prototype, "_bumpTexture", void 0);
      __decorate([
          BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
      ], WaterMaterial.prototype, "bumpTexture", void 0);
      __decorate([
          BABYLON.serializeAsColor3()
      ], WaterMaterial.prototype, "diffuseColor", void 0);
      __decorate([
          BABYLON.serializeAsColor3()
      ], WaterMaterial.prototype, "specularColor", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "specularPower", void 0);
      __decorate([
          BABYLON.serialize("disableLighting")
      ], WaterMaterial.prototype, "_disableLighting", void 0);
      __decorate([
          BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
      ], WaterMaterial.prototype, "disableLighting", void 0);
      __decorate([
          BABYLON.serialize("maxSimultaneousLights")
      ], WaterMaterial.prototype, "_maxSimultaneousLights", void 0);
      __decorate([
          BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
      ], WaterMaterial.prototype, "maxSimultaneousLights", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "windForce", void 0);
      __decorate([
          BABYLON.serializeAsVector2()
      ], WaterMaterial.prototype, "windDirection", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "waveHeight", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "bumpHeight", void 0);
      __decorate([
          BABYLON.serialize("bumpSuperimpose")
      ], WaterMaterial.prototype, "_bumpSuperimpose", void 0);
      __decorate([
          BABYLON.expandToProperty("_markAllSubMeshesAsMiscDirty")
      ], WaterMaterial.prototype, "bumpSuperimpose", void 0);
      __decorate([
          BABYLON.serialize("fresnelSeparate")
      ], WaterMaterial.prototype, "_fresnelSeparate", void 0);
      __decorate([
          BABYLON.expandToProperty("_markAllSubMeshesAsMiscDirty")
      ], WaterMaterial.prototype, "fresnelSeparate", void 0);
      __decorate([
          BABYLON.serialize("bumpAffectsReflection")
      ], WaterMaterial.prototype, "_bumpAffectsReflection", void 0);
      __decorate([
          BABYLON.expandToProperty("_markAllSubMeshesAsMiscDirty")
      ], WaterMaterial.prototype, "bumpAffectsReflection", void 0);
      __decorate([
          BABYLON.serializeAsColor3()
      ], WaterMaterial.prototype, "waterColor", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "colorBlendFactor", void 0);
      __decorate([
          BABYLON.serializeAsColor3()
      ], WaterMaterial.prototype, "waterColor2", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "colorBlendFactor2", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "waveLength", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "waveSpeed", void 0);
      __decorate([
          BABYLON.serialize()
      ], WaterMaterial.prototype, "useLogarithmicDepth", null);
      return WaterMaterial;
  }(BABYLON.PushMaterial));
  BABYLON.WaterMaterial = WaterMaterial;
})(BABYLON);

BABYLON.Effect.ShadersStore['waterVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef BUMP\nvarying vec2 vNormalUV;\n#ifdef BUMPSUPERIMPOSE\nvarying vec2 vNormalUV2;\n#endif\nuniform mat4 normalMatrix;\nuniform vec2 vNormalInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<logDepthDeclaration>\n\nuniform mat4 worldReflectionViewProjection;\nuniform vec2 windDirection;\nuniform float waveLength;\nuniform float time;\nuniform float windForce;\nuniform float waveHeight;\nuniform float waveSpeed;\n\nvarying vec3 vPosition;\nvarying vec3 vRefractionMapTexCoord;\nvarying vec3 vReflectionMapTexCoord;\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef BUMP\nif (vNormalInfos.x == 0.)\n{\nvNormalUV=vec2(normalMatrix*vec4((uv*1.0)/waveLength+time*windForce*windDirection,1.0,0.0));\n#ifdef BUMPSUPERIMPOSE\nvNormalUV2=vec2(normalMatrix*vec4((uv*0.721)/waveLength+time*1.2*windForce*windDirection,1.0,0.0));\n#endif\n}\nelse\n{\nvNormalUV=vec2(normalMatrix*vec4((uv2*1.0)/waveLength+time*windForce*windDirection ,1.0,0.0));\n#ifdef BUMPSUPERIMPOSE\nvNormalUV2=vec2(normalMatrix*vec4((uv2*0.721)/waveLength+time*1.2*windForce*windDirection ,1.0,0.0));\n#endif\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\nvec3 p=position;\nfloat newY=(sin(((p.x/0.05)+time*waveSpeed))*waveHeight*windDirection.x*5.0)\n+(cos(((p.z/0.05)+time*waveSpeed))*waveHeight*windDirection.y*5.0);\np.y+=abs(newY);\ngl_Position=viewProjection*finalWorld*vec4(p,1.0);\n#ifdef REFLECTION\nworldPos=viewProjection*finalWorld*vec4(p,1.0);\n\nvPosition=position;\nvRefractionMapTexCoord.x=0.5*(worldPos.w+worldPos.x);\nvRefractionMapTexCoord.y=0.5*(worldPos.w+worldPos.y);\nvRefractionMapTexCoord.z=worldPos.w;\nworldPos=worldReflectionViewProjection*vec4(position,1.0);\nvReflectionMapTexCoord.x=0.5*(worldPos.w+worldPos.x);\nvReflectionMapTexCoord.y=0.5*(worldPos.w+worldPos.y);\nvReflectionMapTexCoord.z=worldPos.w;\n#endif\n#include<logDepthVertex>\n}\n";
BABYLON.Effect.ShadersStore['waterPixelShader'] = "#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\nprecision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef BUMP\nvarying vec2 vNormalUV;\nvarying vec2 vNormalUV2;\nuniform sampler2D normalSampler;\nuniform vec2 vNormalInfos;\n#endif\nuniform sampler2D refractionSampler;\nuniform sampler2D reflectionSampler;\n\nconst float LOG2=1.442695;\nuniform vec3 cameraPosition;\nuniform vec4 waterColor;\nuniform float colorBlendFactor;\nuniform vec4 waterColor2;\nuniform float colorBlendFactor2;\nuniform float bumpHeight;\nuniform float time;\n\nvarying vec3 vRefractionMapTexCoord;\nvarying vec3 vReflectionMapTexCoord;\nvarying vec3 vPosition;\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef BUMP\n#ifdef BUMPSUPERIMPOSE\nbaseColor=0.6*texture2D(normalSampler,vNormalUV)+0.4*texture2D(normalSampler,vec2(vNormalUV2.x,vNormalUV2.y));\n#else\nbaseColor=texture2D(normalSampler,vNormalUV);\n#endif\nvec3 bumpColor=baseColor.rgb;\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\nbaseColor.rgb*=vNormalInfos.y;\n#else\nvec3 bumpColor=vec3(1.0);\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec2 perturbation=bumpHeight*(baseColor.rg-0.5);\n#ifdef BUMPAFFECTSREFLECTION\nvec3 normalW=normalize(vNormalW+vec3(perturbation.x*8.0,0.0,perturbation.y*8.0));\nif (normalW.y<0.0) {\nnormalW.y=-normalW.y;\n}\n#else\nvec3 normalW=normalize(vNormalW);\n#endif\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\nvec2 perturbation=bumpHeight*(vec2(1.0,1.0)-0.5);\n#endif\n#ifdef FRESNELSEPARATE\n#ifdef REFLECTION\n\nvec3 eyeVector=normalize(vEyePosition-vPosition);\nvec2 projectedRefractionTexCoords=clamp(vRefractionMapTexCoord.xy/vRefractionMapTexCoord.z+perturbation*0.5,0.0,1.0);\nvec4 refractiveColor=texture2D(refractionSampler,projectedRefractionTexCoords);\nvec2 projectedReflectionTexCoords=clamp(vec2(\nvReflectionMapTexCoord.x/vReflectionMapTexCoord.z+perturbation.x*0.3,\nvReflectionMapTexCoord.y/vReflectionMapTexCoord.z+perturbation.y\n),0.0,1.0);\nvec4 reflectiveColor=texture2D(reflectionSampler,projectedReflectionTexCoords);\nvec3 upVector=vec3(0.0,1.0,0.0);\nfloat fresnelTerm=clamp(abs(pow(dot(eyeVector,upVector),3.0)),0.05,0.65);\nfloat IfresnelTerm=1.0-fresnelTerm;\nrefractiveColor=colorBlendFactor*waterColor+(1.0-colorBlendFactor)*refractiveColor;\nreflectiveColor=IfresnelTerm*colorBlendFactor2*waterColor+(1.0-colorBlendFactor2*IfresnelTerm)*reflectiveColor;\nvec4 combinedColor=refractiveColor*fresnelTerm+reflectiveColor*IfresnelTerm;\nbaseColor=combinedColor;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularBase=vec3(0.,0.,0.);\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\nvec3 finalDiffuse=clamp(baseColor.rgb,0.0,1.0);\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#else \n#ifdef REFLECTION\n\nvec3 eyeVector=normalize(vEyePosition-vPosition);\nvec2 projectedRefractionTexCoords=clamp(vRefractionMapTexCoord.xy/vRefractionMapTexCoord.z+perturbation,0.0,1.0);\nvec4 refractiveColor=texture2D(refractionSampler,projectedRefractionTexCoords);\nvec2 projectedReflectionTexCoords=clamp(vReflectionMapTexCoord.xy/vReflectionMapTexCoord.z+perturbation,0.0,1.0);\nvec4 reflectiveColor=texture2D(reflectionSampler,projectedReflectionTexCoords);\nvec3 upVector=vec3(0.0,1.0,0.0);\nfloat fresnelTerm=max(dot(eyeVector,upVector),0.0);\nvec4 combinedColor=refractiveColor*fresnelTerm+reflectiveColor*(1.0-fresnelTerm);\nbaseColor=colorBlendFactor*waterColor+(1.0-colorBlendFactor)*combinedColor;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularBase=vec3(0.,0.,0.);\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\nvec3 finalDiffuse=clamp(baseColor.rgb,0.0,1.0);\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#endif\n\nvec4 color=vec4(finalDiffuse+finalSpecular,alpha);\n#include<logDepthFragment>\n#include<fogFragment>\ngl_FragColor=color;\n}\n";

// END UGLY WATER MATERIAL PLUGIN

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const CONFIG = {
  map: {
    mapSeed: undefined, // Computed later
    // mapSize: 						{ width: 29, height: 25 }, // Logical map size, in cells
    mapSize: { width: 29, height: 25 }, // Logical map size, in cells
    // TODO: Map topping: POINTY is broken!
    mapTopped: HEXLIB.FLAT, // FLAT or POINTY
    // TODO: Map parity: EVEN is broken!
    // mapParity: 					(Math.random() < 0.5) ? EVEN : ODD, // EVEN or ODD
    mapParity: HEXLIB.ODD, // EVEN or ODD

    mapSeaMinLevel: 2, // Sea is flat below this value
    mapValueRange: {
      height: 12,
      moisture: 5
    },
    mapNoise: {
      height: {
        stupidRandom: false,
        frequencyRatio: 0.45, // Noise base size
        frequency: undefined, // To be computed later
        harmonics: [0.5, 0.3, 0.2] // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
      },
      moisture: {
        stupidRandom: false,
        frequencyRatio: 0.72, // Noise base size
        frequency: undefined, // To be computed later
        // harmonics: [0.5, 0.3, 0.2], // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
        harmonics: [0.7, 0.2, 0.1] // Amplitude of noise octaves 0, 1 and 2 (must sum up to 1)
      }
    },
    mapPostprocess: {
      height: {
        revert: false,
        redistributionPower: 2, // >1 => more sea / <1 more mountains
        normalize: true, // Spread the whole height range
        islandMode: true, // All map borders are sea
        islandRedistributionPower: 0.85
      },
      moisture: {
        revert: false,
        redistributionPower: 1,
        normalize: true, // Spread the whole value range
        islandMode: false // All map borders have zero moisture (useless)
      }
    },
    terrain: {
      deepsea: { color: '#000044' }, // 0
      sea: { color: '#0000aa' }, // 1
      shore: { color: '#0000ff' }, // 2

      whitebeach: { color: '#ffff88' }, // 3
      beach: { color: '#eeee44' }, // 3
      swamp: { color: '#888800' }, // 3

      desert: { color: '#e8c789' }, // 4
      grass: { color: '#88cc00' }, // 4 & 5
      plain: { color: '#449900' }, // 4 & 5 & 6

      forest: { color: '#006600' }, // 5 & 6 & 7
      deepforest: { color: '#003300' }, // 6 & 7
      pineforest: { color: '#194d60' }, // 6 & 7 & 8

      mountain: { color: '#aaaaaa' }, // 8
      highmountain: { color: '#666666' }, // 8

      scorched: { color: '#ddddcc' },
      snow: { color: '#ffffff' }, // 10

      ice: { color: '#ccffff' } // 11
    }
  },
  render: {
    cellSizeBase: undefined,	// base size of a cell in px // COMPUTED (on DOM ready)
    cellSizeRatio: 6 / 6,	// perspective cell height diminution ratio
    cellSize: undefined, // size of the cell // COMPUTED (on DOM ready)
    cellRandomRatio: 0.5,
    mapHasPerspective: false,	// if not, render a (visually) flat map
    mapDeepness: undefined, // extrudes cells below them (in pixels) // COMPUTED (on DOM ready)
    mapRangeScale: 5, // in pixels per height unit
    displayTileText: false // debug tiles cost / height
  },
  render3d: {
    cellSize: 1,
    cellStepHeight: 0.5,
    randomTileSizeFactor: 0.15,
    randomTileSizeOffset: 0, // 1 => only smaller / 0.5 => smaller & bigger / 0 => only bigger
    randomTileRotationFactor: 1, // 0 : flat / 1 : sloppy / 2 : chaos
    betterOcean: true
  },

  players: [
    { color: '#ff8000' }, // ORIGIN
    { color: '#ff0080' }  // DESTINATION
  ]
}

// Computed config vars
CONFIG.map.mapNoise.height.frequency =
  CONFIG.map.mapNoise.height.frequencyRatio * CONFIG.map.mapSize.width
CONFIG.map.mapNoise.moisture.frequency =
  CONFIG.map.mapNoise.moisture.frequencyRatio * CONFIG.map.mapSize.width

////////////////////////////////////////////////////////////////////////////////
// TOOLZ

// ARRAY UTILS

// 2D ARRAY INSTANCIATION

const array2d = (x, y) => Array(...Array(x)).map(() => Array(y))

// // ARRAY SHUFFLE
// // From: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

// const arrayShuffle = (array) => {
//   var currentIndex = array.length, temporaryValue, randomIndex

//   // While there remain elements to shuffle...
//   while (0 !== currentIndex) {

//     // Pick a remaining element...
//     randomIndex = Math.floor(Math.random() * currentIndex)
//     currentIndex -= 1

//     // And swap it with the current element.
//     temporaryValue = array[currentIndex]
//     array[currentIndex] = array[randomIndex]
//     array[randomIndex] = temporaryValue
//   }

//   return array
// }

// PRIORITY QUEUE
// From: https://jsfiddle.net/GRIFFnDOOR/r7tvg/
// Savagely adapted/mangled!

const PriorityQueue = (arr) => {
  const queue = {

    heap: [],

    logHeap: function () {
      let output = 'HEAP - '
      for (let i = 0; i < this.heap.length; i++) {
        output += '[' + this.heap[i][0] + ' / ' + this.heap[i][1] + ']'
      }
      console.log(output)
    },

    length: function () {
      return this.heap.length
    },

    push: function (data, priority) {
      var node = [data, priority]
      this.bubble(this.heap.push(node) - 1)
    },

    // removes and returns the data of lowest priority
    pop: function () {
      return this.heap.pop()[0]
    },

    // removes and returns the data of highest priority
    popHigh: function () {
      return this.heap.shift()[0]
    },

    // bubbles node i up the binary tree based on
    // priority until heap conditions are restored
    bubble: function (i) {
      while (i > 0) {
        // var parentIndex = i >> 1 // <=> floor(i/2)	// legacy code
        var parentIndex = i - 1

        // if equal, no bubble (maintains insertion order)
        if (!this.isHigherPriority(i, parentIndex)) break

        this.swap(i, parentIndex)
        i = parentIndex
      }
    },

    // swaps the addresses of 2 nodes
    swap: function (i, j) {
      var temp = this.heap[i]
      this.heap[i] = this.heap[j]
      this.heap[j] = temp
    },

    // returns true if node i is higher priority than j
    isHigherPriority: function (i, j) {
      return this.heap[i][1] > this.heap[j][1]
    }

  }

  if (arr) {
    for (let i = 0; i < arr.length; i++) {
      queue.heap.push(arr[i][0], arr[i][1])
    }
  }

  return queue
}

////////////////////////////////////////////////////////////////////////////////
// MAP

const Map = (config, size, mapTopped, mapParity) => {

  // WEIRD: map is an 2d array WITH methods - TODO better (or not?)
  const map = array2d(size.width, size.height)

  // RANDOMIZE SEED
  // Random seed the noise generator
  map.randomizeSeed = () => {
    map.setSeed(Math.random())
  }

  // SET SEED
  map.setSeed = (seed) => {
    config.mapSeed = seed
    noise.seed(config.mapSeed)
  }

  // GET FROM HEX
  // Returns a map cell from a given (cubic) hex
  map.getFromHex = (hex) => {
    const hexOffset = HEXLIB.hex2Offset(hex, CONFIG.map.mapTopped, CONFIG.map.mapParity)
    if (map[hexOffset.col]) {
      if (map[hexOffset.col][hexOffset.row]) {
        return map[hexOffset.col][hexOffset.row]
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }

  // MAP POPULATE
  // Fill the 2d array with empty objects
  map.populate = () => {
    for (let x = 0; x < size.width; x++) {
      for (let y = 0; y < size.height; y++) {
        map[x][y] = {}
      }
    }
  }

  // NORMALIZE NOISE
  map.normalizeNoise = (val) => val / 2 + 0.5 // From [-1 1] to [0 1]

  // MAP GET RANGE
  map.mapGetRange = (type) => {
    let minValue = 10000
    let maxValue = -10000

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const value = map[x][y][type]
        if (value < minValue) {
          minValue = value
        } else if (value > maxValue) {
          maxValue = value
        }
      }
    }

    return {
      min: minValue,
      max: maxValue
    }
  }

  // MAP LOG RANGE
  map.mapLogRange = (type) => {
    const range = map.mapGetRange(type)
    console.log('MAP RANGE', type, 'min', range.min, 'max', range.max)
  }

  // MAP NORMALIZE
  map.normalizeMap = (type, targetRange) => {
    const range = map.mapGetRange(type)

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const ratio = (map[x][y][type] - range.min) / (range.max - range.min)
        const newHeight = ratio * (targetRange - 0.00001)
        map[x][y][type] = newHeight
      }
    }
  }

  // MAKE ISLAND
  map.makeIsland = (type) => {
    const halfWidth = Math.floor(config.mapSize.width / 2 + 1),
      halfHeight = Math.floor(config.mapSize.height / 2 + 1)
    const offsetCenter = HEXLIB.hexOffset(halfWidth, halfHeight),
      offsetVertical = HEXLIB.hexOffset(halfWidth, 0),
      offsetHorizontal = HEXLIB.hexOffset(0, halfHeight)

    const hexCenter = HEXLIB.offset2Hex(offsetCenter, config.mapTopped, config.mapParity),
      hexVertical = HEXLIB.offset2Hex(offsetVertical, config.mapTopped, config.mapParity),
      hexHorizontal = HEXLIB.offset2Hex(offsetHorizontal, config.mapTopped, config.mapParity)

    const distanceMaxVertical = HEXLIB.hexDistance(
      hexCenter,
      hexVertical
    )
    const distanceMaxHorizontal = HEXLIB.hexDistance(
      hexCenter,
      hexHorizontal
    )
    const distanceMax = Math.min(distanceMaxVertical, distanceMaxHorizontal)
    console.warn('distanceMax', distanceMax)

    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        const offsetTile = HEXLIB.hexOffset(x, y),
          hexTile = HEXLIB.offset2Hex(offsetTile, config.mapTopped, config.mapParity)

        const distance = HEXLIB.hexDistance(hexTile, hexCenter)
        let ratio = distance / distanceMax // from 0 (border) to 1 (center)
        if (ratio < 0) {
          ratio = 0
        } else if (ratio > 1) {
          ratio = 1
        }
        ratio = 1 - ratio
        ratio = Math.pow(ratio, config.mapPostprocess.height.islandRedistributionPower)
        // Add random peaks to border area of the map (otherwise only 'deepsea')
        if (ratio < 0.5) {
          ratio += (Math.random() / 5)
        }
        map[x][y][type] *= ratio
      }
    }
  }

  // GET BIOME
  map.getBiome = (height, moisture) => {

    if (height < 1) { return 'deepsea' }
    if (height < 2) { return 'sea' }
    if (height < 3) { return 'shore' }

    if (height < 4) {
      if (moisture < 1) {
        return 'whitebeach'
      } else if (moisture < 3) {
        return 'beach'
      } else {
        return 'swamp'
      }
    }
    if (height < 5) {
      if (moisture < 1) {
        return 'desert'
      } else if (moisture < 3) {
        return 'grass'
      } else {
        return 'plain'
      }
    }
    if (height < 6) {
      if (moisture < 1) {
        return 'grass'
      } else if (moisture < 3) {
        return 'plain'
      } else {
        return 'forest'
      }
    }
    if (height < 7) {
      if (moisture < 1) {
        return 'plain'
      } else if (moisture < 3) {
        return 'forest'
      } else {
        return 'deepforest'
      }
    }
    if (height < 8) {
      if (moisture < 1) {
        return 'mountain'
      } else if (moisture < 2) {
        return 'forest'
      } else if (moisture < 3) {
        return 'deepforest'
      } else {
        return 'pineforest'
      }
    }

    if (height < 9) {
      if (moisture < 1) {
        return 'mountain'
      } else if (moisture < 3) {
        return 'highmountain'
      } else {
        return 'pineforest'
      }
    }
    if (height < 10) {
      if (moisture < 2) {
        return 'scorched'
      } else {
        return 'snow'
      }
    }
    return 'ice'
  }

  // CREATE MAP BIOMES
  map.createMapBiomes = () => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {
        map[x][y].biome = map.getBiome(map[x][y].height, map[x][y].moisture)
      }
    }
  }

  ///////////////////////////////////////
  // CREATE MAP
  map.createMap = () => {
    // Procedural map generation
    map.createMapData('height', config.mapValueRange.height)
    map.createMapData('moisture', config.mapValueRange.moisture)
    map.createMapBiomes()
  }

  // CREATE MAP DATA
  map.createMapData = (type, range) => {
    for (let x = 0; x < config.mapSize.width; x++) {
      for (let y = 0; y < config.mapSize.height; y++) {

        let value = 0 // From 0 to 1

        // Stupid random value
        if (config.mapNoise[type].stupidRandom) {
          value = Math.random()

          // Noise based value
        } else {
          const nz = [] // noize
          for (let h = 0; h < config.mapNoise[type].harmonics.length; h++) {
            const frequencyDivider =
              config.mapNoise[type].frequency /
              Math.pow(2, h)

            nz[h] = map.normalizeNoise(
              noise.simplex2(
                x / frequencyDivider,
                y / frequencyDivider
              )
            )

            // Redistribution (raise the elevation to a power)
            nz[h] = Math.pow(
              nz[h],
              config.mapPostprocess[type].redistributionPower
            )

            // Revert values
            if (config.mapPostprocess[type].revert) {
              nz[h] = 1 - nz[h]
            }

            value += nz[h] * config.mapNoise[type].harmonics[h]
          }
        }
        map[x][y][type] = value * range
      }
    }

    // Island mode
    if (config.mapPostprocess[type].islandMode) {
      map.makeIsland(type)
    }

    // Normalizing values
    if (config.mapPostprocess[type].normalize) {
      map.normalizeMap(type, config.mapValueRange[type])
    }

    // 		// Make map values as integers
    // 		map.roundMapHeight(dataMap)
  }

  // IS VALID HEIGHT
  // Make the cell part of the graph or not, depending on biome
  map.isValidCellHeight = (biome) => {
    // Seas or mountains aren't valid
    // return (height > (mapSeaLevel + 1) && height < 8) // TODO: magic value
    return (biome !== 'deepsea' && biome !== 'sea'/* && biome !== 'shore'*/)
  }

  // MAP GRAPH
  // Build the pathfinding graph, into the map
  map.generateGraph = () => {

    for (let x = 0; x < size.width; x++) {
      for (let y = 0; y < size.height; y++) {

        const hexOffset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(hexOffset, mapTopped, mapParity),
          neighborsAll = HEXLIB.hexNeighbors(hex),
          neighbors = [],
          costs = [],
          // height = map[x][y].height, // Not in use for now
          biome = map[x][y].biome

        // Add the cell to graph if the height is valid
        map[x][y].isInGraph = map.isValidCellHeight(biome)

        if (map[x][y].isInGraph) {

          // Each (eventual) neighbor of the cell
          for (let i = 0; i < 6; i++) {
            const n = neighborsAll[i],
              no = HEXLIB.hex2Offset(n, mapTopped, mapParity)

            // Is the neighbor on/in the map?
            if (no.col >= 0 &&
              no.row >= 0 &&
              no.col < size.width &&
              no.row < size.height) {

              // Is the neighbor a valid move?
              const neighborHeight = map[no.col][no.row].height,
                neighborBiome = map[no.col][no.row].biome
              if (map.isValidCellHeight(neighborBiome)) {

                // EDGE COST
                // cost = destination height (path will try its best to stay low)
                let cost = 10000
                cost = neighborHeight - CONFIG.map.mapSeaMinLevel
                if (neighborBiome === 'shore') {
                  cost *= 3
                }
                if (neighborBiome === 'mountain' ||
                  neighborBiome === 'highmountain') {
                  cost *= 3
                }
                if (neighborBiome === 'scorched' ||
                  neighborBiome === 'snow' ||
                  neighborBiome === 'ice') {
                  cost *= 4
                }
                // cost = Math.floor(cost)
                costs.push(cost)	// add the edge cost to the graph

                // ADD EGDE
                neighbors.push(n)
              }
            }
          }
        }

        // Backup things into cell
        map[x][y].hex = hex
        map[x][y].hexOffset = hexOffset
        map[x][y].neighbors = neighbors
        map[x][y].costs = costs
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // PATH FINDING

  // As we have no string hex notation, we use hex objects as 'indexes'
  // in a 2d array: [hex][value]

  // GET INDEX HEXES
  // Return an array of hexex from an array with theses hexes as indexes
  map.getIndexHexes = (cameFrom) => {
    const hexes = []
    for (let h = 0; h < cameFrom.length; h++) {
      hexes.push(cameFrom[h][0])
    }
    return hexes
  }

  // FIND FROM HEX
  // Return a value from an hex index
  map.findFromHex = (data, hex) => {
    for (let h = 0; h < data.length; h++) {
      if (HEXLIB.hexEqual(data[h][0], hex)) {
        return data[h][1]
      }
    }
    return undefined
  }

  // A-STAR PATHFINDING
  // Find a path between 2 hexes
  // From: 
  //	http://www.redblobgames.com/pathfinding/a-star/introduction.html
  //	http://www.redblobgames.com/pathfinding/a-star/implementation.html
  map.findPath = (start, goal, earlyExit = true) => {

    if (!map.getFromHex(start).isInGraph) console.warn('A*: start hex is NOT in graph!')
    if (!map.getFromHex(goal).isInGraph) console.warn('A*: goal hex is NOT in graph!')

    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
        map[x][y].cost = 100000000
      }
    }

    const frontier = PriorityQueue() // List of the places still to explore
    const cameFrom = [] // List of where we've already been
    const costSoFar = []	// The price we paid to go there
    let found = false

    frontier.push(start, 0)
    cameFrom.push([start, undefined])
    costSoFar.push([start, 0])

    // LOOP
    while (frontier.length() > 0) {

      const current = frontier.pop()
      const currentHex = map.getFromHex(current)
      if (!currentHex.isInGraph) console.error('A*: current hex is NOT in graph!')

      // const	neighbors = arrayShuffle(currentHex.neighbors)	// cheapo edge breaks
      const neighbors = currentHex.neighbors
      const costs = currentHex.costs

      if (goal) {
        if (HEXLIB.hexEqual(current, goal)) {
          found = true
          // Early exit (stop exploring map when goal is reached)
          if (earlyExit) break
        }
      }

      for (let n = 0; n < neighbors.length; n++) {
        if (!map.getFromHex(neighbors[n]).isInGraph) console.error('argl!')

        const next = neighbors[n],
          nextCost = costs[n],
          newCost = map.findFromHex(costSoFar, current) // sum of the current cost...
            + nextCost, // ...plus the cost of the next move
          // cameFromHexes = map.getIndexHexes(cameFrom), // Not in use for now
          comeSoFarHexes = map.getIndexHexes(costSoFar)

        if (!HEXLIB.hexIndexOf(comeSoFarHexes, next) || newCost < costSoFar[next]) {
          costSoFar.push([next, newCost])
          const priority = newCost + HEXLIB.hexDistance(next, goal) // heuristic
          frontier.push(next, priority)
          cameFrom.push([next, current])

          // Cost backup
          const nextOffset = HEXLIB.hex2Offset(next)
          map[nextOffset.col][nextOffset.row].cost = Math.floor(newCost)
        }
      }
    }

    // BUILD PATH BACK FROM GOAL

    if (goal && found) {
      let current = goal
      let path = [goal]

      while (!HEXLIB.hexEqual(current, start)) {
        current = map.findFromHex(cameFrom, current)
        path.push(current)
      }

      return path.reverse()
    } else {
      return undefined
    }
  }

  //////////////////////////////////////////

  // MAP GENERATE
  // Spawn a new map
  map.generate = () => {
    map.populate()
    map.createMap()
    map.generateGraph()
  }

  // Return the map
  return map
}

////////////////////////////////////////////////////////////////////////////////
// PLAYERS

const Player = (color) => {
  const player = {}

  player.color = color

  player.moveToHex = (hex, mapTopped, mapParity) => {
    player.hex = hex
    player.hexOffset = HEXLIB.hex2Offset(hex, mapTopped, mapParity)
  }

  return player
}

const Players = (PLAYERS, mapTopped, mapParity, playerZoneRatio = 1) => {
  const players = []

  for (let p = 0; p < PLAYERS.length; p++) {
    let player = Player(PLAYERS[p].color)
    let col, row

    const randomCol = Math.random(),
      randomRow = Math.random(),
      colStart = Math.floor(CONFIG.map.mapSize.width * randomCol / playerZoneRatio),
      rowStart = Math.floor(CONFIG.map.mapSize.height * randomRow / playerZoneRatio),
      colEnd = Math.floor(CONFIG.map.mapSize.width * (1 - randomCol / playerZoneRatio)),
      rowEnd = Math.floor(CONFIG.map.mapSize.height * (1 - randomRow / playerZoneRatio))

    if (p === 0) { // bottom left
      col = colStart 
      row = rowEnd 
    } else if (p === 1) { // top right
      col = colEnd
      row = rowStart
    }

    player.hexOffset = HEXLIB.hexOffset(col, row)
    player.hex = HEXLIB.offset2Hex(player.hexOffset, mapTopped, mapParity)

    players.push(player)
  }

  return players
}

////////////////////////////////////////////////////////////////////////////////
// RENDERER

const Renderer = (game, CONFIG, ctx) => {
  const renderer = {}

  renderer.game = game	// Backup game
  renderer.ctx = ctx	// Backup ctx

  // COMPUTE MAP SCREEN ORIGIN

  renderer.mapComputeOrigin = (cellSize, mapTopped, mapParity, mapRange, mapRangeScale) => {
    const hexAspect = Math.sqrt(3) / 2	// width/height ratio of an hexagon
    const pespectiveRangeHeight = mapRange * mapRangeScale
    let mapOrigin = {}

    if (mapTopped === HEXLIB.FLAT) {
      mapOrigin.x = cellSize.width
      mapOrigin.y = mapParity === HEXLIB.ODD ?
        cellSize.height * Math.sqrt(3) / 2 + pespectiveRangeHeight :
        cellSize.height * 2 * hexAspect + pespectiveRangeHeight

    } else if (mapTopped === HEXLIB.POINTY) {
      mapOrigin.y = cellSize.height + pespectiveRangeHeight
      mapOrigin.x = mapParity === HEXLIB.ODD ?
        cellSize.width * hexAspect :
        cellSize.width * 2 * hexAspect
    }

    return {
      x: Math.round(mapOrigin.x),
      y: Math.round(mapOrigin.y)
    }
  }

  // COMPUTE MAP SCREEN SIZE

  renderer.mapComputeSize = (mapSize, cellSize, mapTopped, mapDeepness, mapRange, mapRangeScale) => {

    const hexAspect = Math.sqrt(3) / 2	// width/height ratio of an hexagon
    const perspectiveHeight = mapDeepness + mapRange * mapRangeScale

    const mapRenderSize = mapTopped === HEXLIB.FLAT ?
      {
        width: (mapSize.width + 1 / 3) * 2 * 3 / 4 * cellSize.width,
        height: (mapSize.height + 1 / 2) * 2 * cellSize.height * hexAspect + perspectiveHeight
      } : {
        width: (mapSize.width + 1 / 2) * 2 * cellSize.width * hexAspect,
        height: (mapSize.height + 1 / 3) * 2 * 3 / 4 * cellSize.height + perspectiveHeight
      }

    return {
      width: Math.round(mapRenderSize.width),
      height: Math.round(mapRenderSize.height)
    }
  }

  // PLOT CURSOR

  renderer.plotCursor = (e) => {
    const cursor = HEXLIB.hexRound(HEXLIB.pixel2Hex(renderer.layout, HEXLIB.point(
      e.x - renderer.canvasOffset.x,
      e.y - renderer.canvasOffset.y + CONFIG.render.mapDeepness + CONFIG.render.mapRangeScale * CONFIG.map.mapSeaMinLevel	// TODO - better mapping
    )))

    return cursor
  }

  // GET TERRAIN COLOR

  renderer.getTerrainColor = (biome) => {
    return CONFIG.map.terrain[biome].color
  }

  // Z-SORTING (*kind of*)

  renderer.zIndexSort = (index, total, mapParity) => {
    let x
    if (total % 2 === 1) {
      x = mapParity === HEXLIB.EVEN ? index * 2 + 1 : x = index * 2
      if (x >= total) x -= total

    } else {
      if (mapParity === HEXLIB.EVEN) {
        x = index * 2 + 1
        if (x >= total) x -= total + 1
      } else {
        x = index * 2
        if (x >= total) x -= total - 1
      }
    }

    return x
  }

  // DRAWING FUNCTIONS

  // DRAW POLYGON

  renderer.drawPolygon = (corners, h = 0, color = '#ffffff') => {

    // Stroke style
    renderer.ctx.lineWidth = 1
    renderer.ctx.strokeStyle = 'rgba(0,0,0,0.125)'

    // Fill style
    renderer.ctx.fillStyle = color

    renderer.ctx.beginPath()
    renderer.ctx.moveTo(corners[0].x, corners[0].y + h)

    for (let c = 1; c < corners.length; c++) {
      renderer.ctx.lineTo(corners[c].x, corners[c].y + h)
    }

    renderer.ctx.lineTo(corners[0].x, corners[0].y + h)
    renderer.ctx.closePath()

    renderer.ctx.fill()
    renderer.ctx.stroke()
  }

  // DRAW HEXAGON

  renderer.drawHex = (corners, h, color) => {
    renderer.drawPolygon(
      [corners[0], corners[1], corners[2], corners[3], corners[4], corners[5]],
      h,
      color
    )
  }

  // DRAW HEX SIDES

  renderer.drawHexSides = (corners, h, h2, color) => {

    // Front-right side
    renderer.drawPolygon([
      { x: corners[0].x, y: corners[0].y + h },
      { x: corners[0].x, y: corners[0].y + h2 },
      { x: corners[1].x, y: corners[1].y + h2 },
      { x: corners[1].x, y: corners[1].y + h }
    ], 0, shadeBlend(-0.25, color))

    // Front-left side (void if POINTY)
    if (CONFIG.map.mapTopped !== 'pointy') {
      renderer.drawPolygon([
        { x: corners[2].x, y: corners[2].y + h },
        { x: corners[2].x, y: corners[2].y + h2 },
        { x: corners[3].x, y: corners[3].y + h2 },
        { x: corners[3].x, y: corners[3].y + h }
      ], 0, shadeBlend(0.25, color))
    }

    // Front (front-left side if POINTY)
    renderer.drawPolygon([
      { x: corners[1].x, y: corners[1].y + h },
      { x: corners[1].x, y: corners[1].y + h2 },
      { x: corners[2].x, y: corners[2].y + h2 },
      { x: corners[2].x, y: corners[2].y + h }
    ], 0, CONFIG.map.mapTopped !== 'pointy' ?
        shadeBlend(0.0, color) : // middle
        shadeBlend(0.25, color)) // left
  }

  // DRAW HEX TOP

  renderer.drawHexTop = (corners, h, color) => {
    renderer.ctx.fillStyle = color
    renderer.drawHex(corners, h, color)
  }

  // DRAW HEX MESH

  renderer.drawHexMesh = (corners, h, h2, color) => {

    // Draw sides
    if (CONFIG.render.mapHasPerspective) {
      renderer.drawHexSides(corners, h, h2, color)
    }
    // Draw top
    renderer.drawHexTop(corners, h, color)
  }

  // DRAW HEX BASE

  renderer.drawHexBase = (corners, cornersCore, h, h2, color) => {

    renderer.drawHexMesh(corners, h, h2, '#444444')
    renderer.drawHexMesh(cornersCore, h, h + 2, color)
  }

  ////////////////////////////////////////////////////////////////////////////////
  // DRAW MAP

  renderer.drawMap = (ctx, mapTopped, mapParity, mapDeepness, mapRangeScale) => {

    // COMPUTE UI OVERLAY

    const ui = game.ui
    const cursor = game.ui.cursor

    // Cursor path
    let cursorPath = undefined
    if (game.map.getFromHex(cursor) && game.map.getFromHex(cursor).isInGraph) {
      cursorPath = game.map.findPath(game.players[0].hex, cursor)
    }

    // CLEAR CANVAS
    // ctx.clearRect(0, 0, canvas.width, canvas.height) // TODO: canvas is undefined here!

    // MAP LOOP
    for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
      for (let xi = 0; xi < CONFIG.map.mapSize.width; xi++) {

        // Display front cells first
        let x = renderer.zIndexSort(xi, CONFIG.map.mapSize.width, mapParity)

        // Cell variables
        const val = game.map[x][y].height,
          valFlooded = Math.max(val, CONFIG.map.mapSeaMinLevel),
          valFloor = Math.floor(val),

          offset = HEXLIB.hexOffset(x, y),
          hex = HEXLIB.offset2Hex(offset, CONFIG.map.mapTopped, CONFIG.map.mapParity),

          // point = HEXLIB.hex2Pixel(renderer.layout, hex), // Not in use for now
          corners = HEXLIB.hexCorners(renderer.layout, hex),
          cornersOneThird = HEXLIB.hexCorners(renderer.layout, hex, 0.3332),
          cornersHalf = HEXLIB.hexCorners(renderer.layout, hex, 0.5),
          cornersTwoThird = HEXLIB.hexCorners(renderer.layout, hex, 0.6667),

          color = renderer.getTerrainColor(game.map[x][y].biome), // Cell color
          h = CONFIG.render.mapHasPerspective ?
            - Math.floor(valFlooded) * mapRangeScale : 0 // Cell height


        ////////////////////////////////////
        // DRAW

        // Draw terrain mesh
        renderer.drawHexMesh(corners, h, mapDeepness, color)

        // ON-MAP UI

        // Drawline
        for (let i = 0; i < ui.line.length; i++) {
          if (HEXLIB.hexEqual(hex, ui.line[i])) {
            renderer.drawHexTop(cornersHalf, h, game.players[1].color)
          }
        }

        // Draw cursor path
        if (cursorPath) {
          for (let i = 0; i < cursorPath.length; i++) {
            if (HEXLIB.hexEqual(hex, cursorPath[i])) {
              renderer.drawHexTop(cornersHalf, h, '#0080ff')
            }
          }
        }

        // Cursor
        if (HEXLIB.hexEqual(hex, cursor)) {
          renderer.drawHexTop(corners, h, game.players[0].color)
        }

        // Players
        if (game.players) {
          for (let p = 0; p < game.players.length; p++) {
            if (HEXLIB.hexEqual(hex, game.players[p].hex)) {
              // renderer.drawHexTop(corners, h, game.players[p].color)
              // Draw terrain mesh 
              renderer.drawHexBase(cornersTwoThird, cornersOneThird, h - 20, h, game.players[p].color)
            }
          }
        }

        // CELL TEXT
        if (CONFIG.render.displayTileText) {
          ctx.font = '10px Arial'
          ctx.lineWidth = 0
          ctx.fillStyle = 'rgba(255,255,255,0.5)'

          // Write in black on light terrain colors
          // TODO with biomes colors
          if (valFloor === 11 || valFloor === 10 || valFloor === 9 || valFloor === 3) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)'
          }

          // ctx.fillText(valFloor, point.x - 3, point.y + 3 + h)// display height
          // if (game.map[x][y].cost < 1000000) {
          // 	ctx.fillText(game.map[x][y].cost, point.x - 3, point.y + 3 + h)
          // }
        }
      }
    }
  }

  // INIT OTHER THINGS

  renderer.init = () => {

    // Map origin
    renderer.mapOrigin = renderer.mapComputeOrigin(
      CONFIG.render.cellSize,
      CONFIG.map.mapTopped,
      CONFIG.map.mapParity,
      CONFIG.map.mapValueRange.height,
      CONFIG.render.mapRangeScale
    )

    // Map render size
    renderer.mapRenderSize = renderer.mapComputeSize(
      CONFIG.map.mapSize,
      CONFIG.render.cellSize,
      CONFIG.map.mapTopped,
      CONFIG.render.mapDeepness,
      CONFIG.map.mapValueRange.height,
      CONFIG.render.mapRangeScale
    )

    // Layout
    renderer.layout = HEXLIB.layout(
      CONFIG.map.mapTopped ? HEXLIB.orientationFlat : HEXLIB.orientationPointy, // topped
      {
        // cell size in px
        x: CONFIG.render.cellSize.width,
        y: CONFIG.render.cellSize.height
      },
      renderer.mapOrigin // origin
    )
  }

  renderer.init()

  return renderer
}

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D

const Renderer3d = (game, CONFIG, canvas) => {
  const renderer = {},
    map = game.map

  // LAYOUT
  renderer.createLayout = () => {
    return HEXLIB.layout(
      CONFIG.map.mapTopped ? HEXLIB.orientationFlat : HEXLIB.orientationPointy, // topped
      {
        // cell size in px
        x: CONFIG.render3d.cellSize,
        y: CONFIG.render3d.cellSize
      },
      {
        // Origin
        // TODO: auto centering map
        x: -CONFIG.render3d.cellSize * CONFIG.map.mapSize.width * Math.sqrt(2) / 2,
        y: -CONFIG.render3d.cellSize * CONFIG.map.mapSize.height * Math.sqrt(3) / 2
      }
    )
  }

  // CAMERA
  renderer.createCamera = () => {
    // Add a camera to the scene and attach it to the canvas
    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      // Math.PI / 4, 
      // Math.PI / 4, 
      0, // alpha angle
      0, // beta angle
      60, // radius (aka distance)
      new BABYLON.Vector3(
        0,
        // focus height is one stepsize above water level
        CONFIG.render3d.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1 + 1),
        0
      ), // target
      renderer.scene
    )
    camera.attachControl(canvas, true)
    // Constrain camera rotation & zooming
    camera.lowerBetaLimit = 0
    camera.upperBetaLimit = Math.PI / 2
    camera.lowerRadiusLimit = CONFIG.render3d.cellSize * 5
    camera.upperRadiusLimit = CONFIG.render3d.cellSize * 100

    return camera
  }

  // MATERIALS
  renderer.createMaterials = () => {
    // Terrain materials
    for (let [name, value] of Object.entries(CONFIG.map.terrain)) {
      CONFIG.map.terrain[name].material = new BABYLON.StandardMaterial(name, renderer.scene)
      CONFIG.map.terrain[name].material.diffuseColor = new BABYLON.Color3.FromHexString(value.color)

      // Let sea and ice shine!
      if (
        // name !== 'deepsea' &&
        // name !== 'sea' &&
        // name !== 'shore' &&
        name !== 'ice'
      ) {
        CONFIG.map.terrain[name].material.specularColor = new BABYLON.Color3.Black()
      } else {
        CONFIG.map.terrain[name].material.alpha = 0.9
      }
      // CONFIG.map.terrain[name].material.specularColor = new BABYLON.Color3.Black()
    }
  }

  // TILES

  // // HEXAPRISM
  // // aka extruded hexagon
  // renderer.createHexaprismMesh = (corners) => {

  // }

  renderer.redistributeElevationWithGap = (height) => {
    // Increase height gap between lower land & higher sea
    if (
      height > CONFIG.map.mapSeaMinLevel &&
      height < CONFIG.map.mapSeaMinLevel + 1
    ) {
      height = CONFIG.map.mapSeaMinLevel +
        (height - CONFIG.map.mapSeaMinLevel) * 3 / 4
    } else if (
      height > CONFIG.map.mapSeaMinLevel + 1 &&
      height < CONFIG.map.mapSeaMinLevel + 2
    ) {
      height = (CONFIG.map.mapSeaMinLevel + 1) + 0.25 +
        (height - (CONFIG.map.mapSeaMinLevel + 1)) * 3 / 4
    }
    return height
  }

  renderer.createTile = (x, y, cell) => {
    const offset = HEXLIB.hexOffset(x, y),
      hex = HEXLIB.offset2Hex(
        offset,
        CONFIG.map.mapTopped,
        CONFIG.map.mapParity
      ),
      position = HEXLIB.hex2Pixel(renderer.layout, hex), // center of tile top
      corners = HEXLIB.hexCorners(renderer.layout, hex),
      // TODO: larger bottom makes glitch
      cornersBottom = HEXLIB.hexCorners(renderer.layout, hex, CONFIG.render3d.cellSize * 1.25),
      // cornersBottom = corners,
      tile = new BABYLON.Mesh('custom', renderer.scene)

    let height = renderer.redistributeElevationWithGap(cell.height)
    height *= CONFIG.render3d.cellStepHeight

    function getRandomDisp() {
      return (Math.random() - CONFIG.render3d.randomTileSizeOffset) * 2 * CONFIG.render3d.randomTileSizeFactor
    }

    // HACK: Reverse x and y for render
    // map X axis => world Z axis
    // map Y axis => world X axis
    const positions = [
      // top
      corners[0].y + getRandomDisp(), height, corners[0].x + getRandomDisp(),
      corners[1].y + getRandomDisp(), height, corners[1].x + getRandomDisp(),
      corners[2].y + getRandomDisp(), height, corners[2].x + getRandomDisp(),
      corners[3].y + getRandomDisp(), height, corners[3].x + getRandomDisp(),
      corners[4].y + getRandomDisp(), height, corners[4].x + getRandomDisp(),
      corners[5].y + getRandomDisp(), height, corners[5].x + getRandomDisp(),

      // bottom (base)
      cornersBottom[0].y + getRandomDisp(), 0, cornersBottom[0].x + getRandomDisp(),
      cornersBottom[1].y + getRandomDisp(), 0, cornersBottom[1].x + getRandomDisp(),
      cornersBottom[2].y + getRandomDisp(), 0, cornersBottom[2].x + getRandomDisp(),
      cornersBottom[3].y + getRandomDisp(), 0, cornersBottom[3].x + getRandomDisp(),
      cornersBottom[4].y + getRandomDisp(), 0, cornersBottom[4].x + getRandomDisp(),
      cornersBottom[5].y + getRandomDisp(), 0, cornersBottom[5].x + getRandomDisp()
    ]
    var indices = [
      // Top
      0, 2, 1,
      0, 3, 2,
      0, 4, 3,
      0, 5, 4,

      // Sides
      0, 1, 6,
      7, 6, 1,
      1, 2, 7,
      8, 7, 2,
      2, 3, 8,
      9, 8, 3,
      3, 4, 9,
      10, 9, 4,
      4, 5, 10,
      11, 10, 5,
      5, 6, 11,
      0, 6, 5
    ]

    // BULD MESH
    var vertexData = new BABYLON.VertexData()
    vertexData.positions = positions
    vertexData.indices = indices
    vertexData.applyToMesh(tile)

    // ROTATION
    // Set pivot (local center for transformations)
    tile.setPivotPoint(new BABYLON.Vector3(position.y, height, position.x))
    // Random rotation
    tile.rotate(
      BABYLON.Axis.X,
      (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor,
      BABYLON.Space.LOCAL
    )
    tile.rotate(
      BABYLON.Axis.Z,
      (Math.random() - 0.5) * 2 * Math.PI / 16 * CONFIG.render3d.randomTileRotationFactor,
      BABYLON.Space.LOCAL
    )

    // Give the tile mesh a material
    tile.material = CONFIG.map.terrain[cell.biome].material

    return tile
  }

  renderer.createTiles = () => {
    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        map[x][y].tile = renderer.createTile(x, y, map[x][y])

        // Compute ocean transparency
        if (CONFIG.render3d.betterOcean) {
          renderer.ocean.material.addToRenderList(map[x][y].tile)
        }
      }
    }
  }

  renderer.deleteTiles = () => {
    for (let x = 0; x < CONFIG.map.mapSize.width; x++) {
      for (let y = 0; y < CONFIG.map.mapSize.height; y++) {
        // console.warn(map[x][y].tile)
        if (map[x][y] && map[x][y].tile) {
          map[x][y].tile.dispose() // TODO: not deleting tile
        }
      }
    }
  }

  renderer.highlightLine = () => {
    // Drawline
    for (let i = 0; i < game.ui.line.length; i++) {
      const x = game.ui.line[i].x,
        y = game.ui.line[i].y,
        offsetPath = HEXLIB.hexOffset(x, y)
      renderer.highlightLayer.addMesh(
        map[offsetPath.col][offsetPath.row].tile,
        BABYLON.Color3.Red()
      )
      // if (HEXLIB.hexEqual(hex, ui.line[i]))  {
      // 	renderer.highlightLayer.addMesh(map[x][y].tile, BABYLON.Color3.Red())
      // }
    }
  }

  // SKYBOX
  renderer.createSkybox = () => {
    const skybox = BABYLON.Mesh.CreateBox('skyBox', 5000.0, renderer.scene)
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', renderer.scene)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('./img/TropicalSunnyDay', renderer.scene)
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.disableLighting = true
    skybox.material = skyboxMaterial

    return skybox
  }

  // OCEAN
  renderer.createOcean = () => {
    const ocean = BABYLON.Mesh.CreateGround('oceanSurface', 1024, 1024, 16, renderer.scene, false)
    // Position tile mesh
    ocean.position = new BABYLON.Vector3(
      0,
      CONFIG.render3d.cellStepHeight * (CONFIG.map.mapSeaMinLevel + 1),
      0
    )

    // Ocean floor
    renderer.oceanFloor = BABYLON.Mesh.CreateGround('oceanFloor', 1024, 1024, 16, renderer.scene, false)
    // Position tile mesh
    renderer.oceanFloor.position = new BABYLON.Vector3(
      0,
      - 20,
      0
    )
    // const floorMaterial = new BABYLON.StandardMaterial('oceanFloor', renderer.scene)
    // floorMaterial.diffuseColor = new BABYLON.Color3(0,0,0.6)
    renderer.oceanFloor.material = CONFIG.map.terrain['deepsea'].material

    // Water
    let water
    if (CONFIG.render3d.betterOcean) {
      // Special water material
      water = new BABYLON.WaterMaterial('water', renderer.scene, new BABYLON.Vector2(512, 512))
      water.backFaceCulling = true
      water.bumpTexture = new BABYLON.Texture(waterbump, renderer.scene)
      water.windForce = 3
      water.waveHeight = 0
      water.bumpHeight = 0.2
      water.windDirection = new BABYLON.Vector2(1, 1)
      water.waterColor = new BABYLON.Color3(0, 165 / 255, 221 / 255)
      water.colorBlendFactor = 0.25
      // Make skybox reflect into ocean
      water.addToRenderList(renderer.skybox)
      water.addToRenderList(renderer.oceanFloor)
    } else {
      // Simple water material
      water = new BABYLON.StandardMaterial('ocean', renderer.scene)
      water.diffuseColor = new BABYLON.Color3(0.0, 0.0, 0.4)
      // water.emissiveColor = new BABYLON.Color3(0.1,0.2,1)
      water.alpha = 0.5
      water.bumpTexture = new BABYLON.Texture(waterbump, renderer.scene)
    }

    ocean.material = water

    return ocean
  }

  // SHOW AXIS
  renderer.showWorldAxis = (size) => {
    // From: https://doc.babylonjs.com/snippets/world_axes
    const makeTextPlane = (text, color, size) => {
      const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, renderer.scene, true)
      dynamicTexture.hasAlpha = true
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true)
      const plane = BABYLON.Mesh.CreatePlane('TextPlane', size, renderer.scene, true)
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', renderer.scene)
      plane.material.backFaceCulling = false
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0)
      plane.material.diffuseTexture = dynamicTexture
      return plane
    }

    const axisX = BABYLON.Mesh.CreateLines('axisX', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], renderer.scene)
    axisX.color = new BABYLON.Color3(1, 0, 0)
    const xChar = makeTextPlane('X', 'red', size / 10)
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0)

    const axisY = BABYLON.Mesh.CreateLines('axisY', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], renderer.scene)
    axisY.color = new BABYLON.Color3(0, 1, 0)
    const yChar = makeTextPlane('Y', 'green', size / 10)
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size)

    const axisZ = BABYLON.Mesh.CreateLines('axisZ', [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], renderer.scene)
    axisZ.color = new BABYLON.Color3(0, 0, 1)
    const zChar = makeTextPlane('Z', 'blue', size / 10)
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size)
  }

  // INSTANCIATIONS
  renderer.layout = renderer.createLayout()
  renderer.engine = new BABYLON.Engine(canvas, true) // Generate the BABYLON 3D 
  renderer.scene = new BABYLON.Scene(renderer.engine)
  renderer.camera = renderer.createCamera()
  renderer.hemiLight = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(-1, 1, -1), renderer.scene)
  // renderer.hemiLight.intensity = 1
  // Add the highlight layer
  renderer.highlightLayer = new BABYLON.HighlightLayer('hl1', renderer.scene)
  renderer.highlightLayer.outerGlow = false
  // renderer.highlightLayer.addMesh(map[x][y].tile, BABYLON.Color3.Red())

  renderer.createMaterials() // TODO: rewrite w/ local materials
  renderer.skybox = renderer.createSkybox()
  renderer.ocean = renderer.createOcean()
  renderer.showWorldAxis(25)

  // ON-MAP UI

  return renderer
}

////////////////////////////////////////////////////////////////////////////////
// GAME

const Game = (CONFIG, ctx, canvas3d) => {
  const game = {}

  // Set destination tile
  game.onUIClick = (hex) => {
    const line = game.map.findPath(game.players[0].hex, hex)
    if (line) {
      game.players[1].moveToHex(hex)
      game.ui.line = game.map.findPath(game.players[0].hex, game.players[1].hex)
    }
  }

  // GAME MAP
  game.map = Map(
    CONFIG.map,
    CONFIG.map.mapSize,
    CONFIG.map.mapTopped,
    CONFIG.map.mapParity,
    0.25, // CONFIG.terrain.mapLevelRatio, 
    CONFIG.map.mapValueRange.height,
    50, // Erosion
    CONFIG.map.mapSeaMinLevel,
    game.ui
  )

  // GAME RENDERERS
  game.renderer = Renderer(game, CONFIG, ctx)
  game.renderer3d = Renderer3d(game, CONFIG, canvas3d)

  // UI OVERLAY
  game.ui = {}
  game.ui.cursor = HEXLIB.hex(-1, -1) // out of bound cursor
  game.ui.line = []
  game.ui.cursorPath = []

  // GENERATE
  game.generate = () => {
    let line = undefined
    let tryLeft = 100

    game.renderer3d.deleteTiles()

    while (!line && tryLeft >= 0) { // TODO: potential infinity loop ?!
      tryLeft--
      // PLAYERS
      game.players = Players(
        CONFIG.players,
        CONFIG.map.mapTopped,
        CONFIG.map.mapParity
        //playerZoneRatio has default value
      )
      game.map.generate()

      // Try to draw a path between the two first players
      line = game.map.findPath(game.players[0].hex, game.players[1].hex)
    }

    if (line) {
      // Update 3d terrain
      game.renderer3d.createTiles()

      game.ui.line = line
      // game.renderer3d.highlightLine()
    }
  }

  return game
}

// TODO: move these two loners

const sizeGame = (CONFIG, canvasWrapper) => {
  const canvasWrapperWidth = canvasWrapper.offsetWidth,
    canvasWrapperHeight = canvasWrapper.offsetHeight

  // TODO: better & more accurate
  // Topped
  const fitWidth = Math.floor(canvasWrapperWidth * (3 / 4) / (CONFIG.map.mapSize.width + 3))
  const fitHeight = Math.floor((canvasWrapperHeight / CONFIG.render.cellSizeRatio) / ((CONFIG.map.mapSize.height + 2) * Math.sqrt(3)))
  const fitSize = Math.min(fitWidth, fitHeight)

  CONFIG.render.cellSizeBase = fitSize

  // Computed vars

  CONFIG.render.cellSize = {}
  CONFIG.render.cellSize.width = CONFIG.render.cellSizeBase
  CONFIG.render.cellSize.height = Math.floor(CONFIG.render.cellSizeBase * CONFIG.render.cellSizeRatio)

  CONFIG.render.mapDeepness = CONFIG.render.cellSizeBase / 4 // TODO: magic value!
}

const sizeCanvas = (canvas, game) => {
  canvas.width = game.renderer.mapRenderSize.width
  canvas.height = game.renderer.mapRenderSize.height

  // Get canvas offset (from top-left viewport corner)
  // (the canvas is supposed to be positionned in CSS)
  game.renderer.canvasOffset = {
    x: canvas.offsetLeft,
    y: canvas.offsetTop
  }
}


////////////////////////////////////////////////////////////////////////////////
// LIVE

window.onload = () => {

  // GET DOM THINGS
  const canvas2d = document.getElementById('canvas'),
    canvas2dWrapper = document.getElementById('canvas-wrapper'),
    canvas3d = document.getElementById('renderCanvas'),

    btnGenerate = document.getElementById('generate'),
    btnRandomSeed = document.getElementById('random-seed')

  // USER INPUT EVENTS
  canvas2d.addEventListener('mousemove', (e) => {
    const cursor = game.renderer.plotCursor(e)
    if (!HEXLIB.hexEqual(cursor, game.ui.cursor)) {
      game.ui.cursor = cursor
      render()
    }
  })

  // window.addEventListener('click', (e) => { 
  // 	// We try to pick an object
  // 	var pickResult = game.renderer3d.scene.pick(game.renderer3d.scene.pointerX, game.renderer3d.scene.pointerY)
  // 	if (pickResult.hit) {
  // 		console.log(pickResult)
  // 		// const cursor = game.renderer.plotCursor(e)
  // 	}
  // 	// if (! HEXLIB.hexEqual(cursor, game.ui.cursor)) {
  // 	// 	game.ui.cursor = cursor
  // 	// 	render()
  // 	// }
  // }) 

  canvas2d.addEventListener('click', (e) => {
    game.onUIClick(game.renderer.plotCursor(e))
    render()
  })

  btnGenerate.addEventListener('click', () => {
    game.generate()
    render()
  })

  btnRandomSeed.addEventListener('click', () => {
    game.map.randomizeSeed()
    game.generate()
    render()
  })

  window.onresize = () => {
    sizeGame(CONFIG, canvas2dWrapper)
    game.renderer.init()
    sizeCanvas(canvas2d, game)
    game.renderer3d.engine.resize()

    render()
  }

  // CREATE THE GAME

  // Auto-size canvas
  sizeGame(CONFIG, canvas2dWrapper)

  const ctx = canvas2d.getContext('2d')

  const game = Game(CONFIG, ctx, canvas3d)
  game.map.randomizeSeed()
  game.generate()

  // Set canvas size
  sizeCanvas(canvas2d, game)

  // ANIMATION LOOP
  const render = () => {
    game.renderer.drawMap(
      ctx,
      CONFIG.map.mapTopped,
      CONFIG.map.mapParity,
      CONFIG.render.mapDeepness,
      CONFIG.render.mapRangeScale)
  }

  // LAUCH LOOP

  // This is commented, but cannot be removed (infinite loop) WTF?!?!?!
  //!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ 
  // (function animloop(){
  // 	render()
  // 	window.requestAnimationFrame(animloop)
  // })()
  //!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ 

  // 2D
  // Initial rendering
  render()

  // 3D
  // Register a render loop to repeatedly render the scene
  game.renderer3d.engine.runRenderLoop(() => {
    game.renderer3d.scene.render()
  })

}	// End window.onload


