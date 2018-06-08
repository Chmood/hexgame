import BABYLON from 'babylonjs'
import HEXLIB from '../vendor/hexlib.js'
import CONFIG from './config.js'

// image import (for Webpack loading & bundling as dependencies)
import waterbump from "../../img/waterbump.png"
// 'useless' ones are because of BabylonJS skybox structure
// (no direct link to the 6 images in the code below)
import img1 from "../../img/TropicalSunnyDay_nx.jpg"
import img2 from "../../img/TropicalSunnyDay_ny.jpg"
import img3 from "../../img/TropicalSunnyDay_nz.jpg"
import img4 from "../../img/TropicalSunnyDay_px.jpg"
import img5 from "../../img/TropicalSunnyDay_py.jpg"
import img6 from "../../img/TropicalSunnyDay_pz.jpg"

////////////////////////////////////////////////////////////////////////////////
// RENDERER 3D

// TODO: correct import of the water material plugin

// import waterMaterial from '../vendor/water-material.js'
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


const Renderer3d = (game, canvas) => {
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

export default Renderer3d