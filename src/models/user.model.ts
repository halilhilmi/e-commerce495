import { model, Schema } from 'mongoose';
import isemail from 'isemail';
import {
	IUser,
} from '../interfaces/user.interface';
import { UpdateQuery } from 'mongoose';


const UserSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: true,
		},
		surname: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			validate: {
				validator: (v: string) => isemail.validate(v),
				message: (props: { value: any }) =>
					`${props.value} is not a valid email address`,
			},
		},
		phone: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			default: null,
		},
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 10
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		createdAt: Date,
		updatedAt: Date,
	},
	{
		autoCreate: true,
		autoIndex: true,
		timestamps: true,
		collection: 'user',
	}
);

UserSchema.set('toJSON', {
	transform: function (doc, ret, opt) {
		delete ret['password'];
		return ret;
	},
});


UserSchema.post('updateOne', async function () {
  try {
    const update = this.getUpdate() as UpdateQuery<any>;

    if (update.$set) {
      console.log(this.getQuery());
      
      const user = await this.model.findOne(this.getQuery());

      if (user) {
        Object.keys(update.$set).forEach((key) => {
          user[key] = update.$set[key];
        });

      }
    }
  } catch (error) {
    console.error("Error in post-updateOne middleware:", error);
  }
});




const User = model<IUser>('User', UserSchema);

export default User;
