const _ = require('underscore');
const { StyleSheet, css } = require('./lib/aphrodite.js');
const React = require('react');
const ReactDOM = require('react-dom');
const ColorPicker = require('react-color-picker');


const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789';


// from http://stackoverflow.com/a/13542669
const shadeColor2 = function(color, percent) {
    // formatting edited by me from original for clarity
    // percent should be a number between -1 and 1
    var f = parseInt(color.slice(1),16);
    var t = percent < 0 ? 0 : 255;
    var p = percent < 0 ? percent * -1 : percent;
    var R = f >> 16;
    var G = f >> 8 & 0x00FF;
    var B = f & 0x0000FF;
    return "#" + (0x1000000 +
            (Math.round((t - R) * p) + R) * 0x10000 +
            (Math.round((t - G) * p) + G) * 0x100 +
            (Math.round((t - B) * p) + B)
        ).toString(16).slice(1);
};

// from http://stackoverflow.com/a/901144
const getParameterByName = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" :
                        decodeURIComponent(results[1].replace(/\+/g, " "));
};

const SC = {
    // Style constants
    sidebarWidth: 200,
    sidebarPadding: 10,
    hueWidth: 10,
    glyphMargin: 2,

    outputTextSize: 30,
    letterSpacing: 2,
    lineHeight: 1.3,

    mediaMedium: `@media (max-width: 550px) and (min-width: 421px)`,
    mediaSmall: `@media (max-width: 420px)`,
};

const Glyph = (props) => {
    const size = props.size || 80;
    const color = props.color || '#eeeeee';
    let textShadow = '';
    let fontWeight = 'normal';
    let background = '#222';
    if (size > 50) {
        fontWeight = 700;
    }
    if (size > 25) {
        // 3D font text shadow from http://markdotto.com/playground/3d-text/
        textShadow =
            '0 1px 0 '+shadeColor2(color, -0.3)+',' +
            '0 2px 0 '+shadeColor2(color, -0.4)+',' +
            '0 4px 1px rgba(0,0,0,.1),'+
            '0 0 5px rgba(0,0,0,.1),'+
            '0 1px 3px rgba(0,0,0,.3)';
    } else {
        textShadow =
            '0 1px 0 '+shadeColor2(color, -0.3)+',' +
            '0 2px 0 '+shadeColor2(color, -0.5)+',' +
            '0 3px 1px rgba(0,0,0,.1),'+
            '0 0 5px rgba(0,0,0,.1)';
    }
    const letterStyles = {
        boxSizing: 'border-box',
        color: color,
        display: 'inline-block',
        fontSize: size,
        lineHeight: size * SC.lineHeight + 'px',
        letterSpacing: props.noLetterSpacing ? 0 : SC.letterSpacing,
        textShadow: textShadow,
        verticalAlign: 'top',
    };
    return <span style={letterStyles}>
        {props.children}
    </span>;
};

const SquareGlyph = (props) => {
    const size = props.size || 80;
    const squareStyles = {
        height: size,
        width: size,
    };
    return <span
        className={css(
            ST.square,
            props.link && ST.squareLink,
            props.link && props.active && ST.squareLinkActive
        )}
        style={squareStyles}
        onClick={props.onClick}
    >
        <Glyph
            {...props}
            noLetterSpacing={true}
            size={size / SC.lineHeight * 0.9}
        />
    </span>;
};

const ColorPickerScreen = React.createClass({
    onDrag: function(color, c) {
        this.props.onColorChange(color);
    },
    render: function() {
        const glyph = this.props.activeGlyph;
        const glyphColor = this.props.activeColor;
        const size = (SC.sidebarWidth -
            SC.hueWidth - 10 -
            4 * SC.glyphMargin) / 2;

        return <div>
            <SquareGlyph
                showBackground={true}
                size={size}
                color={glyphColor}>
                {glyph}
            </SquareGlyph>
            <div className={css(ST.colorPickerWrapper)}>
            <ColorPicker
                key={glyphColor}
                defaultValue={glyphColor}
                color={glyphColor}
                saturationWidth={size}
                saturationHeight={size}
                hueWidth={SC.hueWidth}
                onDrag={this.onDrag}/>
            </div>
        </div>;
    }
});

const App = React.createClass({
    getInitialState: function() {
        return {
            activeGlyph: glyphs[0],
            colors: this.getColors(),
            textValue: `The quick brown fox jumps over the lazy dog

Hi my name is _________

16777216
33554432`,
            textAreaHeight: 200,
        };
    },
    getColors: function() {
        const colors = getParameterByName('colors');
        return colors.length ? JSON.parse(colors) : {};
    },
    onColorChange: function(color) {
        let colors = _.clone(this.state.colors);
        const glyph = this.state.activeGlyph;
        colors[glyph] = color;
        this.setState({
            colors: colors,
        });
    },
    componentDidMount: function() {
        this.setState({
            textAreaHeight: this.inputTextarea.scrollHeight,
        });
    },
    render: function() {
        const colors = this.state.colors;
        const activeGlyph = this.state.activeGlyph;
        const activeColor = colors[activeGlyph];

        const stringifyColors = encodeURIComponent(JSON.stringify(colors));
        const url = '?' + 'colors=' + stringifyColors;

        const printText = function(text) {
            return _.map(text.split("\n"), (line, lineIdx) => {

                const words = line.split(' ');
                return <div
                    key={lineIdx}
                    style={{
                        height: line.trim().length === 0 ? SC.outputTextSize * SC.lineHeight : 'auto',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {_.map(words, (word, wordIdx) => {

                        return <span key={wordIdx}>
                            <span style={{ display: 'inline-block' }}>
                            {_.map(word, (letter, letterIdx) => {
                                const color = colors[letter.toLowerCase()];
                                return <Glyph
                                    key={letterIdx}
                                    size={SC.outputTextSize}
                                    color={color}>
                                    {letter}
                                </Glyph>;
                            })}
                            </span>
                            {wordIdx !== words.length - 1 &&
                                <span className={css(ST.outputSpace)}>
                                    &nbsp;
                            </span>}
                        </span>;
                    })}
                </div>;
            });
        };

        const glyphButtonSize = SC.sidebarWidth

        return (<div>
            <div className={css(ST.textContainer)}>
                <div className={css(ST.innerTextContainer)}>
                    <textarea
                        type="text"
                        onkeyup="textAreaAdjust(this)"
                        className={css(ST.textarea)}
                        style={{
                            height: (this.state.textAreaHeight) + "px",
                        }}
                        ref={(ref) => this.inputTextarea = ref}
                        onKeyUp={(e) => {
                            this.setState({
                                textAreaHeight: e.target.scrollHeight,
                            });
                        }}
                        value={this.state.textValue}
                        onChange={(e) => {
                            this.setState({
                                textValue: e.target.value
                            });
                        }}></textarea>
                </div>
                <div className={css(ST.outputText)}>
                    {printText(this.state.textValue)}
                    <div className={css(ST.blurredOutputText)}>
                        {printText(this.state.textValue)}
                    </div>
                </div>
            </div>
            <div className={css(ST.sidebar)}>
                <div className={css(ST.sidebarTopContent)}>
                    <a
                        className={css(ST.button)}
                        href={url}
                    >
                        Permalink these colors
                    </a>
                    <ColorPickerScreen
                        activeGlyph={activeGlyph}
                        activeColor={activeColor}
                        onColorChange={this.onColorChange}/>
                </div>
                <div className={css(ST.sidebarBottomContent)}>
                    {_.map(glyphs, (glyph, idx) => {
                        const color = colors[glyph];
                        const glyphsPerRow = 6;
                        const glyphSize = Math.floor(
                            (SC.sidebarWidth -
                            (glyphsPerRow * 2) * SC.glyphMargin) /
                            glyphsPerRow
                        );

                        return <SquareGlyph
                                active={activeGlyph === glyph}
                                key={glyph}
                                color={color}
                                size={glyphSize}
                                showBackground={true}
                                link={true}
                                onClick={() => {
                                        this.setState({
                                            activeGlyph: glyph
                                        });
                                    }
                                }>
                            {glyph}
                        </SquareGlyph>;
                    })}
                </div>
            </div>
        </div>);
    }
});

const ST = StyleSheet.create({
    colorPickerWrapper: {
        display: 'inline-block',
        verticalAlign: 'top',
        margin: SC.glyphMargin,
    },

    textContainer: {
        background: 'radial-gradient(ellipse at center,'+
                    'rgba(100,100,100,1) 0%,'+
                    'rgba(60,60,60,1) 100%)',
        overflowY: 'auto',
        position: 'absolute',
        top: 0,
        right: SC.sidebarWidth + 2 * SC.sidebarPadding,
        bottom: 0,
        left: 0,
        [SC.mediaMedium]: {
            position: 'relative',
            height: 300,
        },
        [SC.mediaSmall]: {
            position: 'relative',
            height: 300,
        },
    },
    innerTextContainer: {
        boxSizing: 'border-box',
        padding: '20px 20px 40px',
        position: 'absolute',
        width: '100%',
        zIndex: 1000,
    },

    textarea: {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontFamily: 'lato, sans-serif',
        width: '100%',
        overflow: 'hidden',
        outline: 'none',
        fontSize: SC.outputTextSize,
        lineHeight: SC.lineHeight,
        letterSpacing: SC.letterSpacing,
        padding: 0,
        WebkitTextFillColor: 'transparent',
    },
    outputText: {
        lineHeight: SC.lineHeight,
        margin: '20px 20px 40px',
        position: 'relative',
        fontSize: SC.outputTextSize,
    },
    blurredOutputText: {
        lineHeight: SC.lineHeight,
        opacity: 0.4,
        position: 'absolute',
        top: 0,
        WebkitFilter: 'blur(14px)'
    },
    outputSpace: {
        display: 'inline-block',
        letterSpacing: SC.letterSpacing
    },

    sidebar: {
        background: '#222',
        boxSizing: 'border-box',
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        padding: SC.sidebarPadding,
        overflowY: 'auto',
        textAlign: 'center',
        width: SC.sidebarWidth + 2 * SC.sidebarPadding,
        [SC.mediaMedium]: {
            width: '100%',
            position: 'relative',
        },
        [SC.mediaSmall]: {
            width: '100%',
            position: 'relative',
        },
    },
    sidebarTopContent: {
        [SC.mediaMedium]: {
            float: 'left',
            marginRight: 10,
        },
        [SC.mediaSmall]: {
            display: 'inline-block',
        },
    },
    sidebarBottomContent: {
        [SC.mediaMedium]: {
            marginLeft: SC.sidebarWidth + 10,
        },
    },
    button: {
        background: '#eee',
        border: '1px solid #ddd',
        borderRadius: 3,
        boxSizing: 'border-box',
        color: '#444',
        display: 'inline-block',
        fontSize: 12,
        margin: 2,
        marginBottom: 5,
        padding: 5,
        textDecoration: 'none',
        width: '100%',
    },

    square: {
        background: 'radial-gradient(ellipse at center,'+
            'rgba(80,80,80,1) 0%,'+
            'rgba(60,60,60,1) 100%)',
        display: 'inline-block',
        margin: SC.glyphMargin,
        textAlign: 'center',
    },
    squareLink: {
        cursor: 'pointer',
        ':hover': {
            background: 'radial-gradient(ellipse at center,'+
                'rgba(60,60,60,1) 0%,'+
                'rgba(40,40,40,1) 100%)',
        }
    },
    squareLinkActive: {
        background: 'radial-gradient(ellipse at center,'+
            'rgba(60,60,60,1) 0%,'+
            'rgba(40,40,40,1) 100%)',
    },
});

module.exports = App;