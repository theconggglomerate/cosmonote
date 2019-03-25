const router = require('express').Router()
const {Notes, noteNotes} = require('../db/models')
module.exports = router

router.get('/', async (req, res, next) => {
  try {
    const associations = await Notes.findAll({
      include: [
        {
          model: Notes,
          as: 'source',
          attributes: ['id', 'title']
        }
      ]
    })
    let edges = []
    const nodes = associations.map(note => {
      note.source.forEach(target => {
        edges.push({
          data: {
            source: target.noteNotes.sourceId,
            target: target.id
          }
        })
      })
      return {
        data: {
          id: note.id,
          label: note.title.slice(0, 10)
        }
      }
    })
    res.send({
      nodes,
      edges
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const noteId = req.params.id
    const noteSource = await Notes.findOne({
      where: {
        id: noteId
      },
      include: [
        {
          model: Notes,
          as: 'source',
          attributes: ['id', 'title']
        }
      ]
    })
    const noteTarget = await Notes.findOne({
      where: {
        id: noteId
      },
      include: [
        {
          model: Notes,
          as: 'target',
          attributes: ['id', 'title']
        }
      ]
    })
    const sourceArr = noteSource.source.concat(noteTarget.target)
    noteSource.source = sourceArr
    const note = noteSource

    let noteArray = [
      {
        data: {
          id: noteId,
          label: note.title.slice(0, 10)
        }
      }
    ]
    let edges = note.source.map(target => {
      noteArray.push({
        data: {
          id: target.id,
          label: target.title.slice(0, 10)
        }
      })
      return {
        data: {
          source: target.noteNotes.sourceId,
          target: target.noteNotes.targetId
        }
      }
    })
    const noteObject = {
      nodes: noteArray,
      edges
    }
    res.send(noteObject)
  } catch (err) {
    next(err)
  }
})

router.get('/expand/:id', async (req, res, next) => {
  try {
    const noteId = req.params.id
    const centerId = req.body.centerId
    const note = await Notes.findOne({
      where: {
        id: noteId
      },
      include: [
        {
          model: Notes,
          as: 'source',
          attributes: ['id', 'title']
        },
        {
          model: Notes,
          as: 'target',
          attributs: ['id', 'title']
        }
      ]
    })

    let noteArray = [
      {
        data: {
          id: noteId,
          label: note.title.slice(0, 10)
        }
      }
    ]
    let edges = note.source.map(target => {
      noteArray.push({
        data: {
          id: target.id,
          label: target.title.slice(0, 10)
        }
      })
      return {
        data: {
          source: target.noteNotes.sourceId,
          target: target.noteNotes.targetId
        }
      }
    })
    let newNoteArray = noteArray.filter(
      element => element.data.id !== noteId && element.data.id !== centerId
    )
    let newEdges = edges.filter(
      edge =>
        edge.data.source !== noteId &&
        edge.data.target !== centerId &&
        edge.data.target !== noteId &&
        edge.data.source !== centerId
    )
    const noteObject = {
      nodes: newNoteArray,
      edges: newEdges
    }
    res.send(noteObject)
  } catch (err) {
    next(err)
  }
})

router.post('/newAssociation', async (req, res, next) => {
  try {
    ctargetId = req.body.sourceId
    const targetId = req.body.targetId
    const assocTry1 = await noteNotes.findOne({
      where: {sourceId: sourceId, targetId: targetId}
    })
    const assocTry2 = await noteNotes.findOne({
      where: {sourceId: targetId, targetId: sourceId}
    })

    const success = assocTry1 || assocTry2
    if (success) {
      res.status(409).send('Association already exists')
    }
    await noteNotes.create({
      sourceId,
      targetId,
      type: 'general'
    })
    const note = await Notes.findByPk(sourceId, {
      include: [
        {model: Notes, as: 'source', attributes: ['id', 'title']},
        {model: Notes, as: 'target', attributes: ['id', 'title']}
      ]
    })

    res.status(200).send(note)
  } catch (err) {
    next(err)
  }
})

router.delete('/association', async (req, res, next) => {
  try {
    const sourceId = parseInt(req.body.sourceId, 10)
    const targetId = parseInt(req.body.targetId, 10)
    console.log(req.body)
    console.log('sourceId:', sourceId)
    console.log('targetId:', targetId)
    const note = await Notes.findByPk(sourceId, {
      include: [
        {model: Notes, as: 'source', attributes: ['id', 'title']},
        {model: Notes, as: 'target', attributes: ['id', 'title']}
      ]
    })

    const assocTry1 = await noteNotes.findOne({
      where: {sourceId: sourceId, targetId: targetId}
    })
    const assocTry2 = await noteNotes.findOne({
      where: {sourceId: targetId, targetId: sourceId}
    })

    const success = assocTry1 || assocTry2
    if (success) {
      await note.removeSource(targetId)
      await note.removeTarget(targetId)
      const updated = await Notes.findByPk(sourceId, {
        include: [
          {model: Notes, as: 'source', attributes: ['id', 'title']},
          {model: Notes, as: 'target', attributes: ['id', 'title']}
        ]
      })
      res.send(updated)
    } else {
      res.sendStatus(500)
    }
  } catch (err) {
    next(err)
  }
})
