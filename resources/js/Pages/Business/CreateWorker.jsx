import { useForm } from "@inertiajs/react";
import { Link } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { route } from "@/utils/routes";

export default function CreateWorker() {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        phone: "",
        photo: null,
        service_type: "",
        skills: "",
        experience_years: 0,
        city: "",
        area: "",
        availability: "available",
        monthly_rate: "",
        bio: "",
        password: "",
        password_confirmation: "",
    });

    // Fetch service types from API
    const { serviceTypes } = useServiceTypes();

    const submit = (e) => {
        e.preventDefault();
        post(route("business.workers.store"));
    };

    return (
        <PublicLayout>
            

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Add New Worker</h2>
                        <p className="mt-2 text-gray-600">Add a worker to your agency</p>
                    </div>

                    <form onSubmit={submit} className="bg-white shadow-sm rounded-lg p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email Address *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="phone" value="Phone Number *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData("phone", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="service_type" value="Service Type *" className="text-gray-700 font-medium" />
                                <select
                                    id="service_type"
                                    value={data.service_type}
                                    onChange={(e) => setData("service_type", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select Service</option>
                                    {serviceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.service_type} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="city" value="City *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="city"
                                    type="text"
                                    value={data.city}
                                    onChange={(e) => setData("city", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.city} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="area" value="Area *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="area"
                                    type="text"
                                    value={data.area}
                                    onChange={(e) => setData("area", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.area} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="experience_years" value="Experience (Years) *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="experience_years"
                                    type="number"
                                    min="0"
                                    value={data.experience_years}
                                    onChange={(e) => setData("experience_years", parseInt(e.target.value))}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.experience_years} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="availability" value="Availability *" className="text-gray-700 font-medium" />
                                <select
                                    id="availability"
                                    value={data.availability}
                                    onChange={(e) => setData("availability", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                    <option value="available">Available</option>
                                </select>
                                <InputError message={errors.availability} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="monthly_rate" value="Monthly Rate" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="monthly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.monthly_rate}
                                    onChange={(e) => setData("monthly_rate", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                                <InputError message={errors.monthly_rate} className="mt-2" />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="photo" value="Photo" className="text-gray-700 font-medium" />
                                <input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData("photo", e.target.files[0])}
                                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                <InputError message={errors.photo} className="mt-2" />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="skills" value="Skills" className="text-gray-700 font-medium" />
                                <textarea
                                    id="skills"
                                    value={data.skills}
                                    onChange={(e) => setData("skills", e.target.value)}
                                    rows={3}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Enter skills separated by commas..."
                                />
                                <InputError message={errors.skills} className="mt-2" />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="bio" value="Bio" className="text-gray-700 font-medium" />
                                <textarea
                                    id="bio"
                                    value={data.bio}
                                    onChange={(e) => setData("bio", e.target.value)}
                                    rows={4}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Brief description about the worker..."
                                />
                                <InputError message={errors.bio} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password *" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData("password_confirmation", e.target.value)}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <PrimaryButton
                                disabled={processing}
                                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 rounded-lg font-semibold shadow-lg"
                            >
                                {processing ? "Adding Worker..." : "Add Worker"}
                            </PrimaryButton>
                            <Link
                                to={route("business.workers")}
                                className="flex-1 text-center bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}

