import mongoose, {
  CreateOptions,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  SortOrder,
  UpdateQuery,
} from 'mongoose';
import { PipelineStage } from 'mongoose';

type FilterQuery<T> = mongoose.QueryFilter<T>;

interface IFind<T> {
  filter?: FilterQuery<T>;
  projection?: ProjectionType<T>;
  options?: QueryOptions;
  sort?: { [key: string]: SortOrder };
  limit?: number;
  skip?: number;
  populate?: PopulateOptions[];
}

interface IFindOne<T> {
  filter: FilterQuery<T>;
  projection?: ProjectionType<T>;
  options?: QueryOptions;
  populate?: PopulateOptions[];
}

interface IUpdateOne<T> {
  filter: FilterQuery<T>;
  update: UpdateQuery<T>;
  options?: QueryOptions;
}

export abstract class BaseRepo<T> {
  constructor(private readonly model: Model<T>) {}

  create(document: mongoose.InferSchemaType<any>) {
    return this.model.create(document);
  }

  createWithOptions(document: Partial<T>, options?: CreateOptions) {
    return this.model
      .create([document as any], options)
      .then((docs) => docs[0]);
  }

  findOne({
    filter,
    projection = {},
    options = {},
    populate = [],
  }: IFindOne<T>) {
    return this.model.findOne(filter, projection, options).populate(populate);
  }

  find({
    filter = {},
    projection = {},
    options = {},
    sort = {},
    limit = 10,
    skip = 0,
    populate = [],
  }: IFind<T> = {}) {
    const query = this.model.find(filter || {}, projection, options);
    if (sort) query.sort(sort);
    if (limit) query.limit(limit);
    if (skip) query.skip(skip);
    if (populate) query.populate(populate);
    return query;
  }

  deleteOne(filter: FilterQuery<T>) {
    return this.model.deleteOne(filter);
  }

  delete(filter: FilterQuery<T> = {}) {
    return this.model.deleteMany(filter);
  }

  updateOne({ filter, update, options = {} }: IUpdateOne<T>) {
    return this.model.findOneAndUpdate(filter, update, {
      ...options,
      new: true,
    });
  }

  aggregate<TOutput = any>(pipeline: PipelineStage[]) {
    return this.model.aggregate<TOutput>(pipeline);
  }

  count(filter: FilterQuery<T> = {}) {
    return this.model.countDocuments(filter);
  }
}
