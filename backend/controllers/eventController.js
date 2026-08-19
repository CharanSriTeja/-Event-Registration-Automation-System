const prisma = require('../config/prisma');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private (Admin)
const createEvent = async (req, res, next) => {
  try {
    const { name, date, venue, capacity, description } = req.body;
    let coverImageUrl = null;

    if (req.file) {
      coverImageUrl = req.file.path;
    }

    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        venue,
        capacity: parseInt(capacity, 10),
        description,
        coverImageUrl
      }
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Admin)
const updateEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { name, date, venue, capacity, description } = req.body;
    
    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (date) updateData.date = new Date(date);
    if (venue) updateData.venue = venue;
    if (capacity) updateData.capacity = parseInt(capacity, 10);
    if (description) updateData.description = description;

    if (req.file) {
      updateData.coverImageUrl = req.file.path;
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    res.status(200).json(updatedEvent);
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404);
      return next(new Error('Event not found'));
    }
    next(error);
  }
};

// @desc    Delete an event completely
// @route   DELETE /api/events/:id
// @access  Private (Admin)
const deleteEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    
    // Transaction to delete all related data then the event
    await prisma.$transaction([
      prisma.qrSendJob.deleteMany({ where: { eventId } }),
      prisma.registration.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } })
    ]);
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404);
      return next(new Error('Event not found'));
    }
    next(error);
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
