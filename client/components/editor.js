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
  clearNote,
  deletePopup,
  turnOffModal,
  deleteNote
} from './../store'
import GeneralLinks from './GeneralLinks'
import {Grid, Button, Input, Modal} from 'semantic-ui-react'
import {ScrollSync, ScrollSyncPane} from 'react-scroll-sync'
import brace from 'brace'
import 'brace/theme/katzenmilch'
import 'brace/theme/cobalt'
import ScrollLock from 'react-scrolllock'

import debounce from 'lodash.debounce'

export class Editor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      title: '',
      cells: [],
      theme: 'cobalt',
      enableLiveAutocompletion: true,
      fontSize: 14,
      currentIdx: 0
    }
  }

  refresh = () => {
    const noteId = this.props.match.params.noteId
    this.allowNavigate()
    if (noteId === 'new') {
      this.props.clearEditor()
      this.props.clearNote()
      this.props.history.push('/editor')
    } else if (noteId) {
      this.props.getProject(noteId)
      this.props.selectNote(noteId)
    } else if (this.props.editor.id) {
      const id = this.props.editor.id
      this.props.history.push(`/editor/${id}`)
    }
  }

  allowNavigate = () => {
    if (
      this.refs[0] &&
      this.refs[0].editor &&
      !this.refs[0].editor.keyBinding.$handlers[1]
    ) {
      let xander = 0
    }
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
        if (this.refs[i].editor.keyBinding.$handlers[1]) {
          this.refs[i].editor.keyBinding.removeKeyboardHandler(function(
            data,
            hash,
            keyString,
            keyCode,
            event
          ) {})
        }
        this.refs[i].editor.keyBinding.addKeyboardHandler(function(
          data,
          hash,
          keyString,
          keyCode,
          event
        ) {
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
      }
    }
  }

  componentDidMount = () => {
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
        this.props.match.params.noteId !== 'new' &&
        this.props.match.params.noteId !== 'null') ||
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
    this.refresh()
  }

  deletePopup = () => {
    this.props.deleteConfirm()
  }

  closeModal = () => {
    this.props.closeModal()
  }

  deleteNote = () => {
    const id = this.props.editor.id || this.props.match.params.noteId
    this.props.deleteNote(id)
    this.new()
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
    const id = this.props.match.params.noteId
    return (
      <div className="editorcontainer">
        <ScrollSync>
          <div style={{paddingLeft: '3em'}}>
            <ScrollLock>
              <div style={{padding: '1.5em', marginRight: '1em'}}>
                {' '}
                {/* <Button inverted={true} color="white" onClick={this.save}>
                      {' '}
                      Save Note
                    </Button> */}
                <Button inverted={true} onClick={this.new}>
                  {' '}
                  Create a New Note
                </Button>
                {this.props.match.params.noteId ? (
                  <>
                    <Button
                      inverted={true}
                      onClick={() => {
                        this.props.history.push(`/notes/${id}`)
                      }}
                    >
                      {' '}
                      Set to Render View
                    </Button>
                    <Button
                      inverted={true}
                      onClick={() => {
                        this.props.history.push(`/visual/${id}`)
                      }}
                    >
                      {' '}
                      Visualize
                    </Button>
                    <Button negative onClick={this.deletePopup}>
                      Delete note
                    </Button>
                  </>
                ) : (
                  ''
                )}
              </div>
              <Grid divided="vertically">
                <Grid.Row columns={2}>
                  <Grid.Column>
                    <ScrollSyncPane>
                      <div className="scrollable" ref="editor-scroll">
                        <Input
                          style={{
                            margin: '3em 1em 2em 1em',
                            height: '3em',
                            width: '95%'
                          }}
                          type="text"
                          onChange={this.handleTitle}
                          value={this.props.editor.title}
                          placeholder="Enter a title..."
                        />
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
                                    theme="katzenmilch"
                                    name="MarkdownEditor"
                                    onChange={value =>
                                      this.handleChange(value, idx)
                                    }
                                    value={this.props.editor.cells[idx].content}
                                    fontSize={this.state.fontSize}
                                    showPrintMargin={true}
                                    showGutter={true}
                                    highlightActiveLine={false}
                                    highlightActiveWord={true}
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
                        <div style={{margin: '3em 2em 8em 2em'}}>
                          <Button
                            style={{marginRight: '1em'}}
                            className="button"
                            inverted={true}
                            onClick={this.newCode}
                          >
                            New Code Block
                          </Button>
                          <Button
                            style={{marginRight: '1em'}}
                            className="button"
                            inverted={true}
                            onClick={this.newMarkdown}
                          >
                            {' '}
                            New Markdown Block{' '}
                          </Button>

                          <GeneralLinks
                            style={{marginRight: '1em'}}
                            noteId={this.props.match.params.noteId}
                          />
                        </div>
                      </div>
                    </ScrollSyncPane>
                  </Grid.Column>
                  <Grid.Column>
                    <ScrollSyncPane>
                      <div className="scrollable">
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

                        <br />
                        <br />
                        <br />
                      </div>
                    </ScrollSyncPane>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </ScrollLock>
          </div>
        </ScrollSync>
        <Modal open={this.props.modal.warning} style={{padding: '3em'}}>
          <h1>Are you sure you want to delete this note?</h1>
          <Button onClick={this.closeModal} style={{marginRight: '1em'}}>
            {' '}
            Cancel{' '}
          </Button>
          <Button
            negative
            onClick={this.deleteNote}
            style={{marginRight: '1em'}}
          >
            {' '}
            Delete{' '}
          </Button>
        </Modal>
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    editor: state.editor,
    selectedNote: state.notes,
    modal: state.modal
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
    },
    deleteConfirm: () => {
      dispatch(deletePopup())
    },
    deleteNote: id => {
      dispatch(deleteNote(id))
    },
    closeModal: () => {
      dispatch(turnOffModal())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor)
