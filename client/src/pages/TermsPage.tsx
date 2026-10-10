import { Link } from 'react-router-dom';

export const TermsPage = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-3xl font-bold text-white mb-2">Terms & Conditions</h1>
            <p className="text-gray-500 text-sm mb-10">Last updated: February 2026</p>

            <div className="space-y-8">
                {/* Payment Disclaimer */}
                <section className="card border-2 border-amber-500/20">
                    <div className="flex items-start gap-3 mb-4">
                        <span className="text-2xl">⚠️</span>
                        <h2 className="text-xl font-bold text-amber-400">Payment Disclaimer</h2>
                    </div>
                    <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                        <p>
                            <strong className="text-white">We do NOT hold, process, or manage any payments.</strong> All payments on this platform are made <strong className="text-white">directly between the client and freelancer</strong> using UPI, QR codes, or other direct payment methods.
                        </p>
                        <p>
                            Our platform provides a milestone-based tracking system to help both parties record payment progress. However, this is a tracking tool only — we are not a payment intermediary, payment holding service, or financial institution.
                        </p>
                        <p className="text-amber-400/80">
                            By using this platform, you acknowledge that payment transactions are solely between the client and freelancer. We bear no responsibility for payment disputes, delays, or fraud.
                        </p>
                    </div>
                </section>

                {/* How It Works */}
                <section className="card">
                    <h2 className="text-lg font-bold text-white mb-4">💳 How Payments Work</h2>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <span className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                            <div>
                                <p className="text-white text-sm font-medium">Freelancer sets up payment info</p>
                                <p className="text-gray-500 text-xs">Freelancers add their UPI ID and/or QR code to their profile.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                            <div>
                                <p className="text-white text-sm font-medium">Client awards project with milestones</p>
                                <p className="text-gray-500 text-xs">When awarding a bid, the client defines milestones (Part 1, Part 2, etc.) with amounts for each.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                            <div>
                                <p className="text-white text-sm font-medium">Client pays directly & marks "I Have Paid"</p>
                                <p className="text-gray-500 text-xs">Client sends money directly to the freelancer's UPI/QR and marks the milestone as paid on the platform with a transaction note.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                            <div>
                                <p className="text-white text-sm font-medium">Freelancer confirms "I Received"</p>
                                <p className="text-gray-500 text-xs">Freelancer verifies the payment and confirms receipt on the platform.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Verification */}
                <section className="card">
                    <h2 className="text-lg font-bold text-white mb-4">🛡️ Verification & Safety</h2>
                    <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                        <p>
                            We encourage all users to verify their identity to build trust and prevent fraud:
                        </p>
                        <ul className="space-y-2 ml-4">
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-400">✓</span>
                                <span><strong className="text-white">Email Verification</strong> — Verified on registration</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-400">✓</span>
                                <span><strong className="text-white">Phone Verification</strong> — Add your phone number in your profile</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-400">✓</span>
                                <span><strong className="text-white">Aadhaar Verification</strong> — Add last 4 digits of your Aadhaar for identity verification</span>
                            </li>
                        </ul>
                        <p className="text-gray-500 text-xs mt-2">
                            Verified users display badges on their profile to help others make informed decisions.
                        </p>
                    </div>
                </section>

                {/* User Responsibilities */}
                <section className="card">
                    <h2 className="text-lg font-bold text-white mb-4">📋 User Responsibilities</h2>
                    <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                        <p><strong className="text-white">For Clients:</strong></p>
                        <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 ml-2">
                            <li>Make payments only through the freelancer's listed UPI/QR</li>
                            <li>Include transaction ID when marking a milestone as paid</li>
                            <li>Communicate clearly about project expectations before awarding</li>
                        </ul>
                        <p className="mt-3"><strong className="text-white">For Freelancers:</strong></p>
                        <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 ml-2">
                            <li>Keep your payment details (UPI/QR) up to date</li>
                            <li>Only confirm receipt after verifying the payment in your account</li>
                            <li>Deliver work as agreed upon in milestones</li>
                        </ul>
                    </div>
                </section>

                {/* Dispute */}
                <section className="card">
                    <h2 className="text-lg font-bold text-white mb-4">⚖️ Disputes</h2>
                    <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                        <p>
                            If a payment dispute arises, both parties should first attempt to resolve it through direct communication via our messaging system.
                        </p>
                        <p>
                            If no resolution is reached, either party can raise a dispute flag. Our team will review the evidence (transaction IDs, work delivered, messages) and provide mediation.
                        </p>
                        <p className="text-amber-400/80 text-xs">
                            Note: Since payments are made directly, we cannot reverse or process refunds. Dispute resolution is advisory only.
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="card text-center py-8">
                    <p className="text-gray-500 text-sm mb-3">Have questions about these terms?</p>
                    <Link to="/help" className="btn-primary">Contact Support</Link>
                </section>
            </div>
        </div>
    );
};
