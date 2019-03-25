import React, {Component} from 'react'
import AceEditor from 'react-ace'
import 'brace/mode/jsx'
import 'brace/ext/language_tools'
import 'brace/ext/searchbox'
import 'brace/mode/markdown'
import 'brace/snippets/markdown'
import ReactMarkdown from 'react-markdown'
import {Code} from './../components/'
import CodeDisplay from './CodeDisplay'
import {connect} from 'react-redux'
import {
  selectNote,
  makeCodeBlock,
  makeMarkdownBlock,
  editBlock,
  getProject,
  createProject,
  saveProject,
  editTitle,
  clearEditor,
  clearNote
} from './../store'
import GeneralLinks from './GeneralLinks'
import {Grid} from 'semantic-ui-react'
import {ScrollSync, ScrollSyncPane} from 'react-scroll-sync'

import debounce from 'lodash.debounce'

export class Editor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      title: '',
      cells: [],
      theme: 'monokai',
      enableLiveAutocompletion: true,
      fontSize: 14,
      currentIdx: 0
    }
  }

  refresh = () => {
    const noteId = this.props.match.params.noteId

    if (noteId === 'new') {
      this.props.clearEditor()
      this.props.clearNote()
      this.props.history.push('/editor')
    } else if (noteId) {
      this.props.getProject(noteId)
      this.props.selectNote(noteId)
    }
  }

  componentDidMount = () => {
    if (
      this.refs[0] &&
      this.refs[0].editor &&
      !this.refs[0].editor.keyBinding.$handlers[1]
    )
      console.log('refs', this.refs)
    const editorScroll = this.refs['editor-scroll']
    const renderScroll = this.refs['render-scroll']
    for (let i in this.refs) {
      if (
        this.refs.hasOwnProperty(i) &&
        i !== 'render-scroll' &&
        i !== 'editor-scroll'
      ) {
        const this_ref = this.refs[i]
        const editor = this.refs[i].editor

        let nextEditor = undefined
        let prevEditor = undefined
        let nextNum = parseInt(i, 10)
        let prevNum = nextNum - 1
        nextNum++
        let nextRef = undefined
        let prevRef = undefined

        if (this.refs.hasOwnProperty(nextNum)) {
          nextRef = this.refs[nextNum]
          nextEditor = this.refs[nextNum].editor
        }
        if (this.refs.hasOwnProperty(prevNum)) {
          prevEditor = this.refs[prevNum].editor
          prevRef = this.refs[prevNum]
        }

        this.refs[i].editor.keyBinding.addKeyboardHandler(function(
          data,
          hash,
          keyString,
          keyCode,
          event
        ) {
          console.log('keystring', keyString)
          console.log('editor position', editor.getCursorPosition())
          console.log('editor height', editor.getLastVisibleRow())
          console.log('next Editor', nextEditor)
          if (
            editor.getCursorPosition().row === editor.getLastVisibleRow() &&
            nextEditor &&
            keyString === 'down'
          ) {
            nextEditor.moveCursorTo(0, 0)
            nextEditor.focus()
          } else if (
            editor.getCursorPosition().row === 0 &&
            prevEditor &&
            keyString === 'up'
          ) {
            prevEditor.moveCursorTo(prevEditor.getLastVisibleRow(), 0)
            prevEditor.focus()
          }

          if (
            editorScroll.scrollTop >
            editor.container.offsetTop +
              editor.getCursorPosition().row * 14.54545
          ) {
            editorScroll.scrollTop -= 40
          }
          if (
            editor.container.offsetTop +
              editor.getCursorPosition().row * 14.54545 >
            editorScroll.scrollTop + 0.85 * window.innerHeight - 10
          ) {
            editorScroll.scrollTop += 40
          }
        })
        console.log(i, this.refs[i].editor.keyBinding)
      }
    }
    this.refresh()
  }

  componentDidUpdate = prevProps => {
    if (prevProps.match.params.noteId !== this.props.match.params.noteId) {
      this.refresh()
    }
  }

  new = () => {
    this.props.history.push('/editor/new')
  }

  save = () => {
    if (
      (this.props.match.params.noteId &&
        this.props.match.params.noteId !== 'new') ||
      this.props.editor.id
    ) {
      this.props.saveProject(
        this.props.match.params.noteId || this.props.editor.id,
        this.props.editor.title,
        this.props.editor.cells
      )
    } else {
      this.props.createProject(
        this.props.editor.title,
        this.props.editor.cells,
        this.props.history
      )
    }
  }

  autosave = debounce(this.save, 1000, {trailing: true})

  handleTitle = event => {
    event.preventDefault()
    const title = event.target.value
    this.props.editTitle(title)
    this.autosave()
  }

  handleChange = debounce(
    (newValue, idx) => {
      this.props.editBlock(newValue, idx)
      this.autosave()
    },
    100,
    {trailing: true}
  )

  newCode = () => {
    this.props.makeNewCodeBlock()
  }

  newMarkdown = () => {
    this.props.makeNewMarkdownBlock()
  }

  render() {
    return (
      <ScrollSync>
        <div id="editorContainer">
          <Grid divided="vertically">
            <Grid.Row columns={2}>
              <Grid.Column>
                <div>
                  <button onClick={this.newCode}>New Code Block</button>
                  <button onClick={this.newMarkdown}>
                    {' '}
                    New Markdown Block{' '}
                  </button>
                  <button onClick={this.save}> Save Note</button>
                  <button onClick={this.new}> New Note</button>
                  <input
                    type="text"
                    onChange={this.handleTitle}
                    value={this.props.editor.title}
                    placeholder="Enter title here"
                  />
                </div>
                <ScrollSyncPane>
                  <div className="scrollable" ref="editor-scroll">
                    {this.props.editor.cells
                      ? this.props.editor.cells.map((cell, idx) => {
                          return cell.type === 'code' ? (
                            <div className="code" key={idx + 'edcd'}>
                              <AceEditor
                                ref={idx}
                                mode="javascript"
                                theme={this.state.theme}
                                name="CodeEditor"
                                onChange={value =>
                                  this.handleChange(value, idx)
                                }
                                value={this.props.editor.cells[idx].content}
                                fontSize={this.state.fontSize}
                                showPrintMargin={true}
                                showGutter={true}
                                highlightActiveLine={true}
                                width="100%"
                                editorProps={{$blockScrolling: Infinity}}
                                setOptions={{
                                  enableBasicAutocompletion: true,
                                  enableLiveAutocompletion: this.state
                                    .enableLiveAutocompletion,
                                  enableSnippets: true,
                                  showLineNumbers: true,
                                  tabSize: 2,
                                  maxLines: 100,
                                  minLines: 3,
                                  wrap: true
                                }}
                              />
                            </div>
                          ) : (
                            <div className="markdown" key={idx + 'edmd'}>
                              <AceEditor
                                ref={idx}
                                mode="markdown"
                                theme="tomorrow"
                                name="MarkdownEditor"
                                onChange={value =>
                                  this.handleChange(value, idx)
                                }
                                value={this.props.editor.cells[idx].content}
                                fontSize={this.state.fontSize}
                                showPrintMargin={false}
                                showGutter={false}
                                highlightActiveLine={false}
                                highlightActiveWord={true}
                                onInput={() => console.log('input received')}
                                width="100%"
                                editorProps={{$blockScrolling: Infinity}}
                                setOptions={{
                                  enableBasicAutocompletion: true,
                                  enableLiveAutocompletion: this.state
                                    .enableLiveAutocompletion,
                                  enableSnippets: true,
                                  showLineNumbers: true,
                                  tabSize: 2,
                                  maxLines: 100,
                                  minLines: 3,
                                  wrap: true
                                }}
                              />
                            </div>
                          )
                        })
                      : ''}
                  </div>
                </ScrollSyncPane>
              </Grid.Column>
              <Grid.Column>
                <ScrollSyncPane>
                  <div className="scrollable" ref="render-scroll">
                    {this.props.editor.cells ? (
                      <div>
                        <h1>{this.props.editor.title}</h1>
                        {this.props.editor.cells.map((cell, idx) => {
                          if (cell.type === 'markdown') {
                            return (
                              <ReactMarkdown
                                key={idx + 'md'}
                                source={cell.content}
                              />
                            )
                          }
                          if (cell.type === 'code') {
                            return (
                              <CodeDisplay
                                key={idx + 'cd'}
                                keyr={idx + 'cde'}
                                source={cell.content}
                              />
                            )
                          }
                        })}
                      </div>
                    ) : (
                      ''
                    )}
                  </div>
                </ScrollSyncPane>
              </Grid.Column>
            </Grid.Row>
          </Grid>
          <GeneralLinks noteId={this.props.match.params.noteId} />
        </div>
      </ScrollSync>
    )
  }
}

const mapStateToProps = state => {
  return {
    editor: state.editor
  }
}

const mapDispatchToProps = dispatch => {
  return {
    makeNewCodeBlock: () => {
      dispatch(makeCodeBlock())
    },
    makeNewMarkdownBlock: () => {
      dispatch(makeMarkdownBlock())
    },
    editBlock: (content, index) => {
      dispatch(editBlock(content, index))
    },
    createProject: (title, content, history) => {
      dispatch(createProject(title, content, history))
    },
    getProject: id => {
      dispatch(getProject(id))
    },
    selectNote: id => {
      dispatch(selectNote(id))
    },
    saveProject: (id, title, content) => {
      dispatch(saveProject(id, title, content))
    },
    editTitle: title => {
      dispatch(editTitle(title))
    },
    clearEditor: () => {
      dispatch(clearEditor())
    },
    clearNote: () => {
      dispatch(clearNote())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor)
