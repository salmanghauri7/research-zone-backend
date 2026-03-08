export default class BaseRepository {
  /**
   * Initializes the repository with the associated Mongoose model.
   * @param {mongoose.Model} model - The Mongoose model for this repository.
   */
  constructor(model) {
    this.model = model;
  }

  // Find one document
  /**
   * Finds one document matching the query.
   * @param {object} query - The filter query.
   * @param {string | object} [populate=""] - Fields to populate.
   * @returns {Promise<Document | null>}
   */
  async findOne(query, populate = "") {
    let queryBuilder = this.model.findOne(query);
    if (populate) queryBuilder = queryBuilder.populate(populate);
    return queryBuilder;
  }

  // Find by ID
  /**
   * Finds a document by its ID.
   * @param {string | mongoose.Types.ObjectId} id - The document ID.
   * @param {string | object} [populate=""] - Fields to populate.
   * @returns {Promise<Document | null>}
   */
  async findById(id, populate = "") {
    let queryBuilder = this.model.findById(id);
    if (populate) queryBuilder = queryBuilder.populate(populate);
    return queryBuilder;
  }

  // Find multiple documents
  /**
   * Finds multiple documents matching the query.
   * @param {object} [query={}] - The filter query.
   * @param {string | object | Array<string | object>} [populate=""] - Fields to populate.
   * @returns {Promise<Document[]>}
   */
  async find(query = {}, populate = "", select = "", sort="") {
    let queryBuilder = this.model.find(query);
    if (select) {
      queryBuilder = queryBuilder.select(select);
    }
    if (sort) {
      queryBuilder = queryBuilder.sort(sort);
    }
    if (Array.isArray(populate)) {
      populate.forEach((p) => (queryBuilder = queryBuilder.populate(p)));
    } else if (populate) {
      queryBuilder = queryBuilder.populate(populate);
    }
    return queryBuilder;
  }

  // Create a document
  /**
   * Creates a new document.
   * @param {object} data - The data for the new document.
   * @returns {Promise<Document>}
   */
  async create(data) {
    return this.model.create(data);
  }

  // Update one document
  /**
   * Updates the first document that matches the filter.
   * @param {object} filter - The filter query.
   * @param {object} update - The update operation.
   * @returns {Promise<object>} - The result object from Mongoose.
   */
  async updateOne(filter, update, options = {}) {
    return this.model.updateOne(filter, update);
  }

  // Update by ID
  /**
   * Finds a document by ID and updates it, returning the updated document.
   * @param {string | mongoose.Types.ObjectId} id - The document ID.
   * @param {object} update - The update operation.
   * @param {string | object} [populate=""] - Fields to populate in the returned document.
   * @returns {Promise<Document | null>} - The updated document.
   */
  async updateById(id, update, populate = "") {
    // The { new: true } option ensures the updated document is returned
    let queryBuilder = this.model.findByIdAndUpdate(id, update, { new: true });
    if (populate) queryBuilder = queryBuilder.populate(populate);
    return queryBuilder;
  }

  // Delete one document
  /**
   * Deletes the first document that matches the filter.
   * @param {object} filter - The filter query.
   * @returns {Promise<object>} - The result object from Mongoose.
   */
  async deleteOne(filter) {
    return this.model.deleteOne(filter);
  }

  // Delete by ID
  /**
   * Finds a document by ID and deletes it.
   * @param {string | mongoose.Types.ObjectId} id - The document ID.
   * @returns {Promise<Document | null>} - The deleted document.
   */
  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  // Find one and update
  /**
   * Finds one document matching the filter and updates it,
   * optionally populating fields and returning the updated document.
   * @param {object} filter - The filter query.
   * @param {object} update - The update operation.
   * @param {object} options - Additional options (e.g., { new: true }).
   * @param {string | object} [populate=""] - Fields to populate in the returned document.
   * @returns {Promise<Document | null>} - The updated document.
   */
  async findOneAndUpdate(filter, update, options = {}, populate = "") {
    let queryBuilder = this.model.findOneAndUpdate(filter, update, options);

    if (populate) queryBuilder = queryBuilder.populate(populate);

    return queryBuilder;
  }

  /**
   * Performs aggregation operations.
   * @param {Array} pipeline - The aggregation pipeline stages.
   * @returns {Promise<any[]>}
   */
  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}
