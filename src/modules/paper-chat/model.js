import mongoose from 'mongoose';

const ChunkEmbeddingSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace', // References your existing Workspace model
    required: true,
    index: true // Highly recommended for filtering performance
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References your existing User model
    required: true,
    index: true
  },
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper', // Optional for now as requested
    required: false
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number], // Array of floats
    required: true
  },
  metadata: {
    page: { type: Number },
    totalPages: { type: Number },
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for even faster workspace-based lookups
ChunkEmbeddingSchema.index({ workspaceId: 1, userId: 1 });

const ChunkEmbedding = mongoose.models.ChunkEmbedding || mongoose.model('ChunkEmbedding', ChunkEmbeddingSchema);

export default ChunkEmbedding;

// Create the collection after mongoose connection is ready
mongoose.connection.once('open', async () => {
  try {
    await ChunkEmbedding.createCollection();
    console.log('✅ ChunkEmbedding collection created successfully.');
  } catch (error) {
    // Ignore if collection already exists (error code 48)
    if (error.code !== 48) {
      console.error('❌ Error creating ChunkEmbedding collection:', error.message);
    }
  }
});