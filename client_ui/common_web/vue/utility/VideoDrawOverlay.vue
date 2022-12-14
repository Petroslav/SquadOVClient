<template>
    <div
        ref="top"
        class="overlay"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        :style="overlayStyle"
    >
        <div ref="canvasDiv" class="draw-element full-width full-parent-height" :style="canvasStyle">
            <canvas ref="canvas"></canvas>
        </div>
        <div ref="blur" class="draw-element full-width full-parent-height" :style="blurStyle"></div>

        <div id="toolbox" :style="toolboxStyle" v-if="!inactive">
            <template v-if="!mini">
                <div
                    class="d-flex justify-center text-subtitle-2 font-weight-bold py-2"
                    style="user-select: none;"
                    @mousedown="startToolboxMove(arguments[0], true)"
                >
                    TOOLBOX
                </div>

                <v-divider></v-divider>
            </template>

            <div class="d-flex justify-center" v-if="!mini">
                <v-tooltip bottom>
                    <template v-slot:activator="{on, attrs}">
                        <v-btn
                            v-on="on"
                            v-bind="attrs"
                            icon
                            @click="visible = !visible"
                        >
                            <v-icon v-if="visible">
                                mdi-eye-off
                            </v-icon>

                            <v-icon v-else>
                                mdi-eye
                            </v-icon>
                        </v-btn>
                    </template>

                    Toggle Visibility (V)
                </v-tooltip>
            </div>

            <div @mousedown="startToolboxMove(arguments[0], false)" :style="toolDivStyle">
                <v-btn-toggle
                    v-model="selectedTool"
                    style="display: block;"
                >
                    <div class="d-flex align-center" v-if="!mini || selectedTool == 0">
                        <v-tooltip right>
                            <template v-slot:activator="{on, attrs}">
                                <v-btn
                                    v-on="on"
                                    v-bind="attrs"
                                    icon
                                    :value="0"
                                    :disabled="mini"
                                >
                                    <v-icon>
                                        mdi-cursor-default
                                    </v-icon>
                                </v-btn>
                            </template>

                            Select (Ctrl + 1)
                        </v-tooltip>

                        <v-tooltip right v-if="!mini || selectedTool == 1">
                            <template v-slot:activator="{on, attrs}">
                                <v-btn
                                    v-on="on"
                                    v-bind="attrs"
                                    icon
                                    :value="1"
                                    :disabled="mini || disableBrush"
                                >
                                    <v-icon>
                                        mdi-brush
                                    </v-icon>
                                </v-btn>
                            </template>

                            Brush (Ctrl + 2)
                        </v-tooltip>
                    </div>

                    <div class="d-flex align-center">
                        <v-tooltip right v-if="!mini || selectedTool == 2">
                            <template v-slot:activator="{on, attrs}">
                                <v-btn
                                    v-on="on"
                                    v-bind="attrs"
                                    icon
                                    :value="2"
                                    :disabled="mini"
                                >
                                    <v-icon>
                                        mdi-shape
                                    </v-icon>
                                </v-btn>
                            </template>

                            Shapes (Ctrl + 3)
                        </v-tooltip>

                        <v-tooltip right v-if="!mini || selectedTool == 3">
                            <template v-slot:activator="{on, attrs}">
                                <v-btn
                                    v-on="on"
                                    v-bind="attrs"
                                    icon
                                    :value="3"
                                    :disabled="mini || disableLine"
                                >
                                    <v-icon>
                                        mdi-vector-line
                                    </v-icon>
                                </v-btn>
                            </template>

                            Line (Ctrl + 4)
                        </v-tooltip>
                    </div>

                    <div class="d-flex align-center">
                        <v-tooltip right v-if="!mini || selectedTool == 4">
                            <template v-slot:activator="{on, attrs}">
                                <v-btn
                                    v-on="on"
                                    v-bind="attrs"
                                    icon
                                    :value="4"
                                    :disabled="mini || disableText"
                                >
                                    <v-icon>
                                        mdi-format-textbox
                                    </v-icon>
                                </v-btn>
                            </template>

                            Text (Ctrl + 5)
                        </v-tooltip>

                        <v-tooltip right v-if="!mini || selectedTool == 5">
                            <template v-slot:activator="{on, attrs}">
                                <v-btn
                                    v-on="on"
                                    v-bind="attrs"
                                    icon
                                    :value="5"
                                    :disabled="mini || disableBlur"
                                >
                                    <v-icon>
                                        mdi-blur
                                    </v-icon>
                                </v-btn>
                            </template>

                            Blur (Ctrl + 6)
                        </v-tooltip>
                    </div>
                </v-btn-toggle>

                <div class="d-flex justify-center align-center" v-if="!mini">
                    <v-tooltip right>
                        <template v-slot:activator="{on, attrs}">
                            <v-btn
                                class="revert-button"
                                v-on="on"
                                v-bind="attrs"
                                icon
                                @click="undo"
                            >
                                <v-icon>
                                    mdi-undo
                                </v-icon>
                            </v-btn>
                        </template>

                        Undo (Ctrl + Z)
                    </v-tooltip>

                    <v-tooltip right>
                        <template v-slot:activator="{on, attrs}">
                            <v-btn
                                class="revert-button"
                                v-on="on"
                                v-bind="attrs"
                                icon
                                @click="redo"
                            >
                                <v-icon>
                                    mdi-redo
                                </v-icon>
                            </v-btn>
                        </template>

                        Redo (Ctrl + Y)
                    </v-tooltip>
                </div>

                <div class="d-flex justify-center align-center" v-if="!mini">
                    <v-tooltip right>
                        <template v-slot:activator="{on, attrs}">
                            <v-btn
                                class="revert-button"
                                v-on="on"
                                v-bind="attrs"
                                icon
                                @click="deleteObject"
                            >
                                <v-icon>
                                    mdi-delete
                                </v-icon>
                            </v-btn>
                        </template>

                        Delete (Del)
                    </v-tooltip>

                    <v-tooltip right>
                        <template v-slot:activator="{on, attrs}">
                            <v-btn
                                class="revert-button"
                                v-on="on"
                                v-bind="attrs"
                                icon
                                @click="clear"
                            >
                                <v-icon>
                                    mdi-close
                                </v-icon>
                            </v-btn>
                        </template>

                        Clear
                    </v-tooltip>
                </div>

                <div v-if="!mini" id="tool-option-div" class="d-flex">
                    <div class="pa-4" id="tool-option-panel" v-if="showOptions">
                        <select-tool-options
                            v-if="selectedTool == 0"
                            :tool="selectTool"
                        >
                        </select-tool-options>

                        <brush-tool-options
                            v-else-if="selectedTool == 1"
                            :tool="brushTool"
                        >
                        </brush-tool-options>

                        <shape-tool-options
                            v-else-if="selectedTool == 2"
                            :tool="shapeTool"
                            :simple-shapes="simpleShapes"
                        >
                        </shape-tool-options>

                        <line-tool-options
                            v-else-if="selectedTool == 3"
                            :tool="lineTool"
                        >
                        </line-tool-options>

                        <text-tool-options
                            v-else-if="selectedTool == 4"
                            :tool="textTool"
                        >
                        </text-tool-options>

                        <blur-tool-options
                            v-else-if="selectedTool == 5"
                            :tool="blurTool"
                        >
                        </blur-tool-options>
                    </div>

                    <v-btn
                        @click="showOptions = !showOptions"
                        class="pa-0"
                        color="secondary"
                        id="tool-option-expander"
                    >
                        <div class="d-flex flex-column justify-center align-center">
                            <v-icon v-if="showOptions">
                                mdi-chevron-left
                            </v-icon>

                            <v-icon v-else>
                                mdi-chevron-right
                            </v-icon>

                            <div id="tool-option-text">
                                OPTIONS
                            </div>
                        </div>
                    </v-btn>
                </div>
            </div>

            <template v-if="!mini">
                <v-divider class="mb-2"></v-divider>

                <div>
                    <div class="d-flex align-center">
                        <v-tooltip right>
                            <template v-slot:activator="{on, attrs}">
                                <v-icon
                                    v-on="on"
                                    v-bind="attrs"
                                >
                                    mdi-format-color-fill
                                </v-icon>
                            </template>

                            Fill Color
                        </v-tooltip>

                        <color-picker
                            class="flex-grow"
                            v-model="fillColor"
                        >
                        </color-picker>
                    </div>

                    <div class="d-flex align-center my-2">
                        <v-tooltip right>
                            <template v-slot:activator="{on, attrs}">
                                <v-icon
                                    v-on="on"
                                    v-bind="attrs"
                                >
                                    mdi-border-color
                                </v-icon>
                            </template>

                            Outline Color
                        </v-tooltip>

                        <color-picker
                            class="flex-grow"
                            v-model="outlineColor"
                        >
                        </color-picker>
                    </div>

                    <div class="d-flex align-center my-2">
                        <v-tooltip right>
                            <template v-slot:activator="{on, attrs}">
                                <v-icon
                                    v-on="on"
                                    v-bind="attrs"
                                >
                                    mdi-format-color-text
                                </v-icon>
                            </template>

                            Text Color
                        </v-tooltip>

                        <color-picker
                            class="flex-grow"
                            v-model="textColor"
                        >
                        </color-picker>
                    </div>
                </div>
            </template>

            <div id="expand-button">
                <v-btn
                    small
                    icon
                    @click="mini = !mini"
                >
                    <v-icon v-if="mini">
                        mdi-chevron-down
                    </v-icon>

                    <v-icon v-else>
                        mdi-chevron-up
                    </v-icon>
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch, Prop } from 'vue-property-decorator'
import ColorPicker from '@client/vue/utility/draw/ColorPicker.vue'
import { ColorA, getWhiteColor, getRedColor } from '@client/js/color'
import { DrawCanvas } from '@client/js/draw/canvas'
import { BaseDrawTool } from '@client/js/draw/tools/base'
import { SelectTool } from '@client/js/draw/tools/select'
import SelectToolOptions from '@client/vue/utility/draw/SelectToolOptions.vue'
import { BrushTool } from '@client/js/draw/tools/brush'
import BrushToolOptions from '@client/vue/utility/draw/BrushToolOptions.vue'
import { LineTool } from '@client/js/draw/tools/line'
import LineToolOptions from '@client/vue/utility/draw/LineToolOptions.vue'
import { TextTool } from '@client/js/draw/tools/text'
import TextToolOptions from '@client/vue/utility/draw/TextToolOptions.vue'
import { MultiShapeTool } from '@client/js/draw/tools/shapes/shape'
import ShapeToolOptions from '@client/vue/utility/draw/ShapeToolOptions.vue'
import { BlurTool } from '@client/js/draw/tools/blur'
import BlurToolOptions from '@client/vue/utility/draw/BlurToolOptions.vue'
import FontFaceObserver from 'fontfaceobserver'

@Component({
    components: {
        ColorPicker,
        SelectToolOptions,
        BrushToolOptions,
        LineToolOptions,
        TextToolOptions,
        ShapeToolOptions,
        BlurToolOptions,
    }
})
export default class VideoDrawOverlay extends Vue {
    mini: boolean = false
    customLeft: number = 0
    customTop: number = 0

    selectedTool: number | null = null
    showOptions: boolean = false
    visible: boolean = true

    isMoving: boolean = false
    lastMoveX: number = 0
    lastMoveY: number = 0

    fillColor: ColorA = getRedColor()
    outlineColor: ColorA = getWhiteColor()
    textColor: ColorA = getWhiteColor()

    selectTool: SelectTool = new SelectTool()
    brushTool: BrushTool = new BrushTool()
    lineTool: LineTool = new LineTool()
    textTool: TextTool = new TextTool()
    shapeTool: MultiShapeTool = new MultiShapeTool()
    blurTool: BlurTool = new BlurTool()

    @Prop({type: Boolean, default: false})
    inactive!: boolean

    @Prop()
    value!: any

    @Prop({type: Number, default: 26})
    zIndex!: number

    @Prop({type: Boolean, default: false})
    disableBrush!: boolean

    @Prop({type: Boolean, default: false})
    disableLine!: boolean

    @Prop({type: Boolean, default: false})
    disableText!: boolean

    @Prop({type: Boolean, default: false})
    disableBlur!: boolean

    @Prop({type: Boolean, default: false})
    simpleShapes!: boolean

    @Prop({type: Boolean, default: false})
    hidden!: boolean

    draw: DrawCanvas | null = null
    $refs!: {
        top: HTMLElement,
        canvasDiv: HTMLElement,
        canvas: HTMLCanvasElement,
        blur: HTMLElement,
    }

    keydownHandler: any = null

    get finalVisible(): boolean {
        return this.visible && !this.hidden
    }

    @Watch('inactive')
    onToggleInactive() {
        if (this.inactive) {
            this.selectedTool = null
        }
    }

    get canvasStyle(): any {
        let base: any = {
            'z-index': this.zIndex - 1,
        }

        if (this.finalVisible) {
            return base
        } else {
            return {
                visibility: 'hidden',
                ...base
            }
        }
    }

    get blurStyle(): any {
        return {
            'z-index': this.zIndex - 2,
            visibility: this.finalVisible ? 'visible' : 'hidden',
        }
    }

    get toolboxStyle(): any {
        let style: any = {
            left: `calc(10px + ${this.customLeft}px)`,
            top: `calc(50% + ${this.customTop}px)`,
            cursor: 'pointer',
            'z-index': this.zIndex,
        }
        return style
    }

    get toolDivStyle(): any {
        return {
            cursor: 'pointer'
        }
    }

    startToolboxMove(e: MouseEvent, isHeader: boolean) {
        if (!this.mini && !isHeader) {
            return
        }

        this.isMoving = true
        this.lastMoveX = e.clientX
        this.lastMoveY = e.clientY
    }

    onToolboxMove(e: MouseEvent) {
        let diffX = e.clientX - this.lastMoveX
        let diffY = e.clientY - this.lastMoveY

        this.customLeft += diffX
        this.customTop += diffY

        this.lastMoveX = e.clientX
        this.lastMoveY = e.clientY
    }

    endToolboxMove(e: MouseEvent) {
        this.isMoving = false
    }

    onMouseMove(e: MouseEvent) {
        if (this.isMoving) {
            this.onToolboxMove(e)
        }
    }

    onMouseUp(e: MouseEvent) {
        this.endToolboxMove(e)
    }

    onMouseLeave(e: MouseEvent) {
        this.onMouseUp(e)
    }

    overlayResize() {
        if (!this.draw) {
            return
        }

        let bb = this.$refs.canvasDiv.getBoundingClientRect()
        if (!!bb.width && !!bb.height) {
            this.draw.setWidthHeight(bb.width, bb.height)
            this.$emit('canvassize', this.draw._canvasWidth, this.draw._canvasHeight)
        }
    }

    get activeTool(): BaseDrawTool | null {
        if (this.inactive) {
            return null
        }

        if (this.selectedTool === undefined) {
            return null
        }

        switch (this.selectedTool) {
            case 0:
                return this.selectTool
            case 1:
                return this.brushTool
            case 2:
                return this.shapeTool
            case 3:
                return this.lineTool
            case 4:
                return this.textTool
            case 5:
                return this.blurTool
        }
        return null
    }

    @Watch('activeTool')
    syncActiveTool() {
        if (!this.draw) {
            return
        }
        this.draw.setActiveTool(this.activeTool)
    }

    @Watch('activeTool')
    @Watch('fillColor')
    @Watch('outlineColor')
    @Watch('textColor')
    syncToolColors() {
        if (!this.activeTool) {
            return
        }

        this.activeTool.setFillColor(this.fillColor)
        this.activeTool.setOutlineColor(this.outlineColor)
        this.activeTool.setTextColor(this.textColor)
    }

    loadFonts() {
        const fonts = [
            'Open Sans',
            'Lobster Two',
            'Space Mono',
            'Comic Neue'
        ]

        let promises = []
        for (let f of fonts) {
            promises.push(new FontFaceObserver(f, { weight: 400, style: 'normal' }).load())
            promises.push(new FontFaceObserver(f, { weight: 700, style: 'normal' }).load())
            promises.push(new FontFaceObserver(f, { weight: 400, style: 'italic' }).load())
            promises.push(new FontFaceObserver(f, { weight: 700, style: 'italic' }).load())
        }

        Promise.all(promises)
    }

    toggleTool(tool: number) {
        if (this.inactive) {
            return
        }

        if (
            (tool == 1 && this.disableBrush) ||
            (tool == 3 && this.disableLine) ||
            (tool == 4 && this.disableText) ||
            (tool == 5 && this.disableBlur)
        ) {
            return
        }

        if (this.selectedTool === tool) {
            this.selectedTool = null
        } else {
            this.selectedTool = tool
        }
    }

    handleKeypress(e: KeyboardEvent) {
        if (this.inactive) {
            return
        }

        let cmp = e.key.toLowerCase()
        let handled = false

        if (e.ctrlKey && cmp == '1') {
            this.toggleTool(0)
        } else if (e.ctrlKey && cmp == '2') {
            this.toggleTool(1)
        } else if (e.ctrlKey && cmp == '3') {
            this.toggleTool(2)
        } else if (e.ctrlKey && cmp == '4') {
            this.toggleTool(3)
        } else if (e.ctrlKey && cmp == '5') {
            this.toggleTool(4)
        } else if (e.ctrlKey && cmp == '6') {
            this.toggleTool(5)
        } else if (e.ctrlKey && cmp == 'z') {
            this.undo()
        } else if (e.ctrlKey && cmp == 'y') {
            this.redo()
        } else if (cmp == 'v') {
            this.visible = !this.visible
        } else if (cmp == 'delete') {
            this.deleteObject()
        }

        if (handled) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    syncValue() {
        if (!this.value) {
            return
        }

        if (!!this.draw) {
            this.draw.loadState(this.value)
        }
    }

    onHistoryChange() {
        if (!!this.draw) {
            this.$emit('input', this.draw.history.state)
        }
    }

    mounted() {
        this.draw = new DrawCanvas(this.$refs.canvas, this.$refs.blur)
        this.draw.history.setOnHistoryChange(() => {
            this.onHistoryChange()
        })
        this.loadFonts()
        this.selectTool.simple = this.simpleShapes
        
        this.syncActiveTool()
        this.syncToolColors()

        window.addEventListener('resize', this.overlayResize)

        this.keydownHandler = this.handleKeypress.bind(this)
        window.addEventListener('keydown', this.keydownHandler)

        Vue.nextTick(() => {
            this.overlayResize()
        })

        this.syncValue()
    }

    beforeDestroy() {
        window.removeEventListener('resize', this.overlayResize)
        window.removeEventListener('keydown', this.keydownHandler)
    }

    get overlayStyle(): any {
        return {
            'pointer-events': !!this.activeTool ? 'auto' : 'none',
            'z-index': this.zIndex - 3
        }
    }

    undo() {
        if (this.inactive) {
            return
        }

        if (!this.draw) {
            return
        }

        this.draw.undo()
    }

    redo() {
        if (this.inactive) {
            return
        }

        if (!this.draw) {
            return
        }

        this.draw.redo()
    }

    deleteObject() {
        if (this.inactive) {
            return
        }

        if (!this.draw) {
            return
        }

        this.draw.deleteSelected()
    }

    clear() {
        if (this.inactive) {
            return
        }

        if (!this.draw) {
            return
        }

        this.draw.clear()
    }
}

</script>

<style scoped>

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.draw-element {
    position: absolute;
    top: 0;
    left: 0;
}

#toolbox {
    position: relative;
    transform: translateY(-50%);
    pointer-events: auto;
    display: inline-block;
    background-color: #121212;
    border: 2px white solid;
}

#expand-button {
    position: absolute;
    bottom: 0;
    right: 0;
    display: inline-block;
    transform: translateY(100%) translateY(2px);
    background-color: #121212;
    border: 1px white solid;
}

#tool-option-div {
    position: absolute;
    right: 0;
    top: 0;
    transform: translateX(100%) translateX(2px);
}

#tool-option-panel {
    border: 1px solid white;
    overflow: auto;
    width: 300px;
    height: 200px;
    background-color: #121212;
}

#tool-option-expander {
    width: 32px;
    min-width: 0px;
    height: 160px;
    border: 1px solid white !important;
    border-top-left-radius: 0px;
    border-top-right-radius: 5px;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 5px;
}

#tool-option-text {
    writing-mode: vertical-lr;
    text-orientation: upright;
}

.revert-button {
    width: 48px;
    height: 48px;
}

</style>